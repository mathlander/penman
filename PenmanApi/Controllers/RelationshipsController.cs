using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos;
using PenmanApi.Dtos.Relationships;
using PenmanApi.Hubs;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RelationshipsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IHubContext<PenmanHub> _penmanHubContext;
        private readonly IRelationshipService _relationshipService;

        public RelationshipsController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IHubContext<PenmanHub> penmanHubContext, IRelationshipService relationshipService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _penmanHubContext = penmanHubContext;
            _relationshipService = relationshipService;
        }

        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreateRelationshipDto relationshipDto)
        {
            try
            {
                var relationshipEntity = _relationshipService.Create(_mapper.Map<Relationship>(relationshipDto));
                var responseDto = _mapper.Map<RelationshipResponseDto>(relationshipEntity);

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
        public IActionResult ReadAll([FromQuery]ReadAllRelationshipsDto readAllRelationshipsDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var lastReadAll = readAllRelationshipsDto.LastReadAll.HasValue ? readAllRelationshipsDto.LastReadAll.Value : new DateTime(1970, 1, 1);
                var lastReadAllResponse = DateTime.Now;
                var relationships = _relationshipService.ReadAll(authenticatedUserId, readAllRelationshipsDto.UserId, lastReadAll);

                var responseDto = new RelationshipCollectionResponseDto
                {
                    Relationships = relationships.Select(r => _mapper.Map<RelationshipResponseDto>(r)).ToArray(),
                    LastReadAll = lastReadAllResponse,
                };

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read all relationships.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpGet("read")]
        [Produces("application/json")]
        public IActionResult Read([FromQuery]ReadRelationshipDto relationshipDto)
        {
            try
            {
                var relationshipEntity = _relationshipService.Read(relationshipDto.RelationshipId, _httpContextAccessor.GetCurrentUserId());
                var responseDto = _mapper.Map<RelationshipResponseDto>(relationshipEntity);
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to read relationship.  Message: {ex.Message}.");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateRelationshipDto relationshipDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var relationshipEntity = _relationshipService.UpdateRelationship(
                    authenticatedUserId,
                    relationshipDto.RelationshipId,
                    relationshipDto.ObjectClientId,
                    relationshipDto.ChipClientId);
                var responseDto = _mapper.Map<RelationshipResponseDto>(relationshipEntity);

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to update the specified relationship.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteRelationshipDto relationshipDto)
        {
            try
            {
                var authenticatedUserId = _httpContextAccessor.GetCurrentUserId();
                var result = _relationshipService.Delete(authenticatedUserId, relationshipDto.RelationshipId);

                if (result)
                    return Ok();
                else
                    return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to mark the specified relationship as deleted.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }
    }
}
