using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos;
using PenmanApi.Dtos.Shorts;
using PenmanApi.Hubs;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ShortsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHubContext<PenmanHub> _penmanHubContext;
        private readonly IShortService _shortService;

        public ShortsController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IHubContext<PenmanHub> penmanHubContext, IShortService shortService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _penmanHubContext = penmanHubContext;
            _shortService = shortService;
        }

        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreateShortDto shortDto)
        {
            try
            {
                var shortEntity = _shortService.Create(_mapper.Map<Short>(shortDto));
                var responseDto = _mapper.Map<ShortResponseDto>(shortEntity);

                return Ok(responseDto);
            }
            catch (CollisionException)
            {
                return BadRequest(new ErrorResponseDto
                {
                    InternalErrorMessage = "The specified clientId violated the unique constraint.",
                    DisplayErrorMessage = "The API encountered an unexpected error, but the failed request will automatically retry.",
                    ErrorCode = (int)ErrorCodes.ClientIdCollided,
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
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var lastReadAll = readAllShortsDto.LastReadAll.HasValue ? readAllShortsDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var shorts = _shortService.ReadAll(authenticatedUserId, readAllShortsDto.UserId, lastReadAll);

                var responseDto = new ShortCollectionResponseDto
                {
                    Shorts = shorts.Select(s => _mapper.Map<ShortResponseDto>(s)).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all shorts.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadShortDto shortDto)
        {
            try
            {
                var shortEntity = _shortService.Read(shortDto.ShortId, _httpContextAccessor.GetCurrentUserId());
                var responseDto = _mapper.Map<ShortResponseDto>(shortEntity);
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read short.  Message: {ex.Message}.");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateShortDto shortDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var shortEntity = _shortService.UpdateShort(
                    authenticatedUserId,
                    shortDto.ShortId,
                    shortDto.Title,
                    shortDto.Body,
                    shortDto.EventStart,
                    shortDto.EventEnd);
                var responseDto = _mapper.Map<ShortResponseDto>(shortEntity);

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update the specified short.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteShortDto shortDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var result = _shortService.Delete(authenticatedUserId, shortDto.ShortId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to mark the specified short as deleted.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
