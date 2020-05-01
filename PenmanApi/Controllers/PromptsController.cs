using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using PenmanApi.Config;
using PenmanApi.Dtos.Prompts;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class PromptsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPromptService _promptService;

        public PromptsController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IPromptService promptService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _promptService = promptService;
        }

        [AllowAnonymous]
        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreatePromptDto promptDto)
        {
            try
            {
                var prompt = _promptService.Create(_mapper.Map<Prompt>(promptDto));
                var responseDto = _mapper.Map<CreatePromptResponseDto>(prompt);

                return Ok(responseDto);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = ex.Message,
                    DisplayErrorMessage = "User is not authorized to execute the given request.",
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpGet("readall")]
        [Produces("application/json")]
        public IActionResult ReadAll([FromQuery]ReadAllPromptsDto readAllPromptsDto)
        {
            ReadAllPromptsResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != readAllPromptsDto.AuthorId)
                    throw new UnauthorizedAccessException($"Requested authorId does not match authenticated authorId.");

                var prompts = _promptService.ReadAll(readAllPromptsDto.AuthorId);

                responseDto = new ReadAllPromptsResponseDto
                {
                    Prompts = prompts.Select(p => _mapper.Map<ReadPromptResponseDto>(p)).ToArray()
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to satisfy refreshToken claim.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadPromptDto promptDto)
        {
            ReadPromptResponseDto responseDto = null;
            try
            {
                var prompt = _promptService.Read(promptDto.PromptId, _httpContextAccessor.GetCurrentUserId());
                responseDto = _mapper.Map<ReadPromptResponseDto>(prompt);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to satisfy refreshToken claim.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdatePromptDto promptDto)
        {
            UpdatePromptDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != promptDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to update the specified prompt.");

                var prompt = _promptService.UpdatePrompt(promptDto.PromptId, promptDto.AuthorId, promptDto.Title, promptDto.Body);
                responseDto = _mapper.Map<UpdatePromptDto>(prompt);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to satisfy refreshToken claim.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery]DeletePromptDto promptDto)
        {
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != promptDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to delete the specified prompt.");

                var result = _promptService.Delete(promptDto.PromptId, promptDto.AuthorId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to satisfy refreshToken claim.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
