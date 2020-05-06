using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos.Personifications;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class PersonificationsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPersonificationService _personificationService;

        public PersonificationsController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IPersonificationService personificationService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _personificationService = personificationService;
        }

        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreatePersonificationDto personificationDto)
        {
            try
            {
                var personification = _personificationService.Create(_mapper.Map<Personification>(personificationDto));
                var responseDto = _mapper.Map<CreatePersonificationResponseDto>(personification);

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
        public IActionResult ReadAll([FromQuery]ReadAllPersonificationsDto readAllPersonificationsDto)
        {
            ReadAllPersonificationsResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != readAllPersonificationsDto.AuthorId)
                    throw new UnauthorizedAccessException($"Requested authorId does not match authenticated authorId.");

                var lastReadAll = readAllPersonificationsDto.LastReadAll.HasValue ? readAllPersonificationsDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var personifications = _personificationService.ReadAll(readAllPersonificationsDto.AuthorId, lastReadAll);

                responseDto = new ReadAllPersonificationsResponseDto
                {
                    Personifications = personifications.Select(p => _mapper.Map<ReadPersonificationResponseDto>(p)).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all personifications.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadPersonificationDto personificationDto)
        {
            ReadPersonificationResponseDto responseDto = null;
            try
            {
                var personification = _personificationService.Read(personificationDto.PersonificationId, _httpContextAccessor.GetCurrentUserId());
                responseDto = _mapper.Map<ReadPersonificationResponseDto>(personification);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read personification.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdatePersonificationDto personificationDto)
        {
            UpdatePersonificationResponseDto responseDto = null;
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != personificationDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to update the specified personification.");

                var personification = _personificationService.UpdatePersonification(personificationDto.PersonificationId, personificationDto.AuthorId, personificationDto.FirstName, personificationDto.MiddleName, personificationDto.LastName, personificationDto.Birthday);
                responseDto = _mapper.Map<UpdatePersonificationResponseDto>(personification);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update personification.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }

            return Ok(responseDto);
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeletePersonificationDto personificationDto)
        {
            try
            {
                if (_httpContextAccessor.GetCurrentUserId() != personificationDto.AuthorId)
                    throw new UnauthorizedAccessException("You are not authorized to delete the specified personification.");

                var result = _personificationService.Delete(personificationDto.PersonificationId, personificationDto.AuthorId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete personification.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
