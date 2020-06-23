using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos;
using PenmanApi.Dtos.Chapters;
using PenmanApi.Hubs;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChaptersController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHubContext<PenmanHub> _penmanHubContext;
        private readonly IChapterService _chapterService;

        public ChaptersController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IHubContext<PenmanHub> penmanHubContext, IChapterService chapterService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _penmanHubContext = penmanHubContext;
            _chapterService = chapterService;
        }

        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreateChapterDto chapterDto)
        {
            try
            {
                var chapterEntity = _chapterService.Create(_mapper.Map<Chapter>(chapterDto));
                var responseDto = _mapper.Map<ChapterResponseDto>(chapterEntity);

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
        public IActionResult ReadAll([FromQuery]ReadAllChaptersDto readAllChaptersDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var lastReadAll = readAllChaptersDto.LastReadAll.HasValue ? readAllChaptersDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var chapters = _chapterService.ReadAll(authenticatedUserId, readAllChaptersDto.UserId, lastReadAll);

                var responseDto = new ChapterCollectionResponseDto
                {
                    Chapters = chapters.Select(c => _mapper.Map<ChapterResponseDto>(c)).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all chapters.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadChapterDto chapterDto)
        {
            try
            {
                var chapterEntity = _chapterService.Read(chapterDto.ChapterId, _httpContextAccessor.GetCurrentUserId());
                var responseDto = _mapper.Map<ChapterResponseDto>(chapterEntity);
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read chapter.  Message: {ex.Message}.");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateChapterDto chapterDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var chapterEntity = _chapterService.UpdateChapter(
                    authenticatedUserId,
                    chapterDto.ChapterId,
                    chapterDto.BookId,
                    chapterDto.EventStart,
                    chapterDto.EventEnd,
                    chapterDto.SortOrder,
                    chapterDto.Title,
                    chapterDto.Body);
                var responseDto = _mapper.Map<ChapterResponseDto>(chapterEntity);

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update the specified chapter.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteChapterDto chapterDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var result = _chapterService.Delete(authenticatedUserId, chapterDto.ChapterId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to mark the specified chapter as deleted.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
