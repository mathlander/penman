using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using AutoMapper;
using PenmanApi.Dtos.Relationships;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class RelationshipsController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IRelationshipService _relationshipService;

        public RelationshipsController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IRelationshipService relationshipService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _relationshipService = relationshipService;
        }

        [HttpPost("relate")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Relate([FromBody]RelateDto relationshipDto)
        {
            /*
            *   Need to resolve the bug introduced by using _httpContextAccessor.GetCurrentUserId().
            *   This breaks things if collaboration is ever enabled.  For now, defer.
            */
            try
            {
                var swap = 0L;

                switch (relationshipDto.Join)
                {
                    case "Tag-to-Personification":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Personification-to-Tag";
                    case "Personification-to-Tag":
                        _relationshipService.RelatePersonificationTag(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Personification-to-Prompt":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Prompt-to-Personification";
                    case "Prompt-to-Personification":
                        _relationshipService.RelatePromptPersonification(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Tag-to-Prompt":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Prompt-to-Tag";
                    case "Prompt-to-Tag":
                        _relationshipService.RelatePromptTag(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Personification-to-Short":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Short-to-Personification";
                    case "Short-to-Personification":
                        _relationshipService.RelateShortPersonification(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Prompt-to-Short":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Short-to-Prompt";
                    case "Short-to-Prompt":
                        _relationshipService.RelateShortPrompt(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Tag-to-Short":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Short-to-Tag";
                    case "Short-to-Tag":
                        _relationshipService.RelateShortTag(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    default:
                        return BadRequest(new ErrorResponseDto
                        {
                            InternalErrorMessage = $"The specified 'join' property [{relationshipDto.Join}] is not valid.",
                            DisplayErrorMessage = "An error occurred while attempting an operation.",
                        });
                }

                return Ok();
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

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]RelateDto relationshipDto)
        {
            try
            {
                var swap = 0L;

                switch (relationshipDto.Join)
                {
                    case "Tag-to-Personification":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Personification-to-Tag";
                    case "Personification-to-Tag":
                        _relationshipService.UnrelatePersonificationTag(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Personification-to-Prompt":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Prompt-to-Personification";
                    case "Prompt-to-Personification":
                        _relationshipService.UnrelatePromptPersonification(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Tag-to-Prompt":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Prompt-to-Tag";
                    case "Prompt-to-Tag":
                        _relationshipService.UnrelatePromptTag(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Personification-to-Short":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Short-to-Personification";
                    case "Short-to-Personification":
                        _relationshipService.UnrelateShortPersonification(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Prompt-to-Short":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Short-to-Prompt";
                    case "Short-to-Prompt":
                        _relationshipService.UnrelateShortPrompt(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    case "Tag-to-Short":
                        swap = relationshipDto.RightId;
                        relationshipDto.RightId = relationshipDto.LeftId;
                        relationshipDto.LeftId = swap;
                        goto case "Short-to-Tag";
                    case "Short-to-Tag":
                        _relationshipService.UnrelateShortTag(relationshipDto.LeftId, relationshipDto.RightId, _httpContextAccessor.GetCurrentUserId());
                        break;

                    default:
                        return BadRequest(new ErrorResponseDto
                        {
                            InternalErrorMessage = $"The specified 'join' property [{relationshipDto.Join}] is not valid.",
                            DisplayErrorMessage = "An error occurred while attempting an operation.",
                        });
                }

                return Ok();
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
    }
}
