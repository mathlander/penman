using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos.Chapters;
using PenmanApi.Dtos.Timelines;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ChaptersController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IChapterService _chapterService;

        public ChaptersController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IChapterService chapterService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
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
                var responseDto = _mapper.Map<CreateChapterResponseDto>(chapterEntity);

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
        public IActionResult ReadAll([FromQuery]ReadAllChaptersDto readAllChaptersDto)
        {
            ReadAllChaptersResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != readAllChaptersDto.AuthorId)
                    throw new UnauthorizedAccessException($"Requested authorId does not match authenticated authorId.");

                var lastReadAll = readAllChaptersDto.LastReadAll.HasValue ? readAllChaptersDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var chapters = _chapterService.ReadAll(readAllChaptersDto.AuthorId, readAllChaptersDto.BookId, lastReadAll);

                responseDto = new ReadAllChaptersResponseDto
                {
                    Chapters = chapters.Select(c => 
                        {
                            var chapterResponseDto = _mapper.Map<ReadChapterResponseDto>(c);
                            chapterResponseDto.Timeline = c.Timeline == null
                                ? null
                                : _mapper.Map<ReadTimelineResponseDto>(c.Timeline);
                            return chapterResponseDto;
                        }).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all chapters.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadChapterDto chapterDto)
        {
            ReadChapterResponseDto responseDto = null;
            try
            {
                var chapterEntity = _chapterService.Read(chapterDto.ChapterId, _httpContextAccessor.GetCurrentUserId());
                responseDto = _mapper.Map<ReadChapterResponseDto>(chapterEntity);
                responseDto.Timeline = chapterEntity.Timeline == null
                    ? null
                    : _mapper.Map<ReadTimelineResponseDto>(chapterEntity.Timeline);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read chapter.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateChapterDto chapterDto)
        {
            UpdateChapterResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != chapterDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to update the specified chapter.");

                var chapterEntity = _chapterService.UpdateChapter(chapterDto.ChapterId, chapterDto.AuthorId, chapterDto.BookId, chapterDto.TimelineId, chapterDto.SortOrder, chapterDto.Title);
                responseDto = _mapper.Map<UpdateChapterResponseDto>(chapterEntity);
                responseDto.Timeline = chapterEntity.Timeline == null
                    ? null
                    : _mapper.Map<ReadTimelineResponseDto>(chapterEntity.Timeline);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update chapter.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteChapterDto chapterDto)
        {
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != chapterDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to delete the specified chapter.");

                var result = _chapterService.Delete(chapterDto.ChapterId, chapterDto.AuthorId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete chapter.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
