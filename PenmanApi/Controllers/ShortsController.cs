using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos.Shorts;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ShortsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IShortService _shortService;

        public ShortsController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IShortService shortService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _shortService = shortService;
        }

        [AllowAnonymous]
        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreateShortDto shortDto)
        {
            try
            {
                var shortEntity = _shortService.Create(_mapper.Map<Short>(shortDto));
                var responseDto = _mapper.Map<CreateShortResponseDto>(shortEntity);

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
        public IActionResult ReadAll([FromQuery]ReadAllShortsDto readAllShortsDto)
        {
            ReadAllShortsResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != readAllShortsDto.AuthorId)
                    throw new UnauthorizedAccessException($"Requested authorId does not match authenticated authorId.");

                var lastReadAll = readAllShortsDto.LastReadAll.HasValue ? readAllShortsDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var shorts = _shortService.ReadAll(readAllShortsDto.AuthorId, lastReadAll);

                responseDto = new ReadAllShortsResponseDto
                {
                    Shorts = shorts.Select(s => _mapper.Map<ReadShortResponseDto>(s)).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all shorts.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadShortDto shortDto)
        {
            ReadShortResponseDto responseDto = null;
            try
            {
                var shortEntity = _shortService.Read(shortDto.ShortId, _httpContextAccessor.GetCurrentUserId());
                responseDto = _mapper.Map<ReadShortResponseDto>(shortEntity);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read short.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateShortDto shortDto)
        {
            UpdateShortResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != shortDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to update the specified short.");

                var shortEntity = _shortService.UpdateShort(shortDto.ShortId, shortDto.AuthorId, shortDto.Title, shortDto.Body, shortDto.EventStart, shortDto.EventEnd);
                responseDto = _mapper.Map<UpdateShortResponseDto>(shortEntity);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update short.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteShortDto shortDto)
        {
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != shortDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to delete the specified short.");

                var result = _shortService.Delete(shortDto.ShortId, shortDto.AuthorId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete short.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
