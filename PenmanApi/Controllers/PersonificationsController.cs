using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos;
using PenmanApi.Dtos.Personifications;
using PenmanApi.Hubs;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PersonificationsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHubContext<PenmanHub> _penmanHubContext;
        private readonly IPersonificationService _personificationService;

        public PersonificationsController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IHubContext<PenmanHub> penmanHubContext, IPersonificationService personificationService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _penmanHubContext = penmanHubContext;
            _personificationService = personificationService;
        }

        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreatePersonificationDto personificationDto)
        {
            try
            {
                var personificationEntity = _personificationService.Create(_mapper.Map<Personification>(personificationDto));
                var responseDto = _mapper.Map<PersonificationResponseDto>(personificationEntity);

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
        public IActionResult ReadAll([FromQuery]ReadAllPersonificationsDto readAllPersonificationsDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var lastReadAll = readAllPersonificationsDto.LastReadAll.HasValue ? readAllPersonificationsDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var personifications = _personificationService.ReadAll(authenticatedUserId, readAllPersonificationsDto.UserId, lastReadAll);

                var responseDto = new PersonificationCollectionResponseDto
                {
                    Personifications = personifications.Select(p => _mapper.Map<PersonificationResponseDto>(p)).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all personifications.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadPersonificationDto personificationDto)
        {
            try
            {
                var personificationEntity = _personificationService.Read(personificationDto.PersonificationId, _httpContextAccessor.GetCurrentUserId());
                var responseDto = _mapper.Map<PersonificationResponseDto>(personificationEntity);
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read personification.  Message: {ex.Message}.");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdatePersonificationDto personificationDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var personificationEntity = _personificationService.UpdatePersonification(
                    authenticatedUserId,
                    personificationDto.PersonificationId,
                    personificationDto.FirstName,
                    personificationDto.MiddleName,
                    personificationDto.LastName,
                    personificationDto.Birthday);
                var responseDto = _mapper.Map<PersonificationResponseDto>(personificationEntity);

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update the specified personification.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeletePersonificationDto personificationDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var result = _personificationService.Delete(authenticatedUserId, personificationDto.PersonificationId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to mark the specified personification as deleted.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
