using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos;
using PenmanApi.Dtos.Tags;
using PenmanApi.Hubs;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHubContext<PenmanHub> _penmanHubContext;
        private readonly ITagService _tagService;

        public TagsController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IHubContext<PenmanHub> penmanHubContext, ITagService tagService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _penmanHubContext = penmanHubContext;
            _tagService = tagService;
        }

        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreateTagDto tagDto)
        {
            try
            {
                var tagEntity = _tagService.Create(_mapper.Map<Tag>(tagDto));
                var responseDto = _mapper.Map<TagResponseDto>(tagEntity);

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
        public IActionResult ReadAll([FromQuery]ReadAllTagsDto readAllTagsDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var lastReadAll = readAllTagsDto.LastReadAll.HasValue ? readAllTagsDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var tags = _tagService.ReadAll(authenticatedUserId, readAllTagsDto.UserId, lastReadAll);

                var responseDto = new TagCollectionResponseDto
                {
                    Tags = tags.Select(t => _mapper.Map<TagResponseDto>(t)).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all tags.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadTagDto tagDto)
        {
            try
            {
                var tagEntity = _tagService.Read(tagDto.TagId, _httpContextAccessor.GetCurrentUserId());
                var responseDto = _mapper.Map<TagResponseDto>(tagEntity);
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read tag.  Message: {ex.Message}.");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateTagDto tagDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var tagEntity = _tagService.UpdateTag(
                    authenticatedUserId,
                    tagDto.TagId,
                    tagDto.TagName);
                var responseDto = _mapper.Map<TagResponseDto>(tagEntity);

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update the specified tag.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteTagDto tagDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var result = _tagService.Delete(authenticatedUserId, tagDto.TagId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to mark the specified tag as deleted.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
