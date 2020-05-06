using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos.Books;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class BooksController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IBookService _bookService;

        public BooksController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IBookService bookService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _bookService = bookService;
        }

        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreateBookDto bookDto)
        {
            try
            {
                var bookEntity = _bookService.Create(_mapper.Map<Book>(bookDto));
                var responseDto = _mapper.Map<CreateBookResponseDto>(bookEntity);

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
        public IActionResult ReadAll([FromQuery]ReadAllBooksDto readAllBooksDto)
        {
            ReadAllBooksResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != readAllBooksDto.AuthorId)
                    throw new UnauthorizedAccessException($"Requested authorId does not match authenticated authorId.");

                var lastReadAll = readAllBooksDto.LastReadAll.HasValue ? readAllBooksDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var books = _bookService.ReadAll(readAllBooksDto.AuthorId, lastReadAll);

                responseDto = new ReadAllBooksResponseDto
                {
                    Books = books.Select(b => _mapper.Map<ReadBookResponseDto>(b)).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all books.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadBookDto bookDto)
        {
            ReadBookResponseDto responseDto = null;
            try
            {
                var bookEntity = _bookService.Read(bookDto.BookId, _httpContextAccessor.GetCurrentUserId());
                responseDto = _mapper.Map<ReadBookResponseDto>(bookEntity);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read book.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateBookDto bookDto)
        {
            UpdateBookResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != bookDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to update the specified book.");

                var bookEntity = _bookService.UpdateBook(bookDto.BookId, bookDto.AuthorId, bookDto.TimelineId, bookDto.Title);
                responseDto = _mapper.Map<UpdateBookResponseDto>(bookEntity);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update book.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteBookDto bookDto)
        {
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != bookDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to delete the specified book.");

                var result = _bookService.Delete(bookDto.BookId, bookDto.AuthorId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete book.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
