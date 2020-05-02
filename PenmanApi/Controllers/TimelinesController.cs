using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos.Timelines;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class TimelinesController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITimelineService _timelineService;

        public TimelinesController(IMapper mapper, IHttpContextAccessor httpContextAccessor, ITimelineService timelineService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _timelineService = timelineService;
        }

        [AllowAnonymous]
        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreateTimelineDto timelineDto)
        {
            try
            {
                var timelineEntity = _timelineService.Create(_mapper.Map<Timeline>(timelineDto));
                var responseDto = _mapper.Map<CreateTimelineResponseDto>(timelineEntity);

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
        public IActionResult ReadAll([FromQuery]ReadAllTimelinesDto readAllTimelinesDto)
        {
            ReadAllTimelinesResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != readAllTimelinesDto.AuthorId)
                    throw new UnauthorizedAccessException($"Requested authorId does not match authenticated authorId.");

                var prompts = _timelineService.ReadAll(readAllTimelinesDto.AuthorId);

                responseDto = new ReadAllTimelinesResponseDto
                {
                    Timelines = prompts.Select(s => _mapper.Map<ReadTimelineResponseDto>(s)).ToArray()
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all timelines.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadTimelineDto timelineDto)
        {
            ReadTimelineResponseDto responseDto = null;
            try
            {
                var timelineEntity = _timelineService.Read(timelineDto.TimelineId, _httpContextAccessor.GetCurrentUserId());
                responseDto = _mapper.Map<ReadTimelineResponseDto>(timelineEntity);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read timeline.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateTimelineDto timelineDto)
        {
            UpdateTimelineResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != timelineDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to update the specified timeline.");

                var timelineEntity = _timelineService.UpdateTimeline(timelineDto.TimelineId, timelineDto.AuthorId, timelineDto.Title, timelineDto.EventStart, timelineDto.EventEnd);
                responseDto = _mapper.Map<UpdateTimelineResponseDto>(timelineEntity);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update timeline.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery]DeleteTimelineDto timelineDto)
        {
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != timelineDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to delete the specified timeline.");

                var result = _timelineService.Delete(timelineDto.TimelineId, timelineDto.AuthorId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete timeline.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
