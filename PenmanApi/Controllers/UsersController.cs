using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using PenmanApi.Config;
using PenmanApi.Dtos.Users;
using PenmanApi.Services;
using PenmanApi.Models;

namespace PenmanApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IAuthConfig _authConfig;
        private readonly IAuthorService _authorService;

        public UsersController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IAuthConfig authConfig, IAuthorService authorService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _authConfig = authConfig;
            _authorService = authorService;
        }

        [AllowAnonymous]
        [HttpPost("authenticate")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Authenticate([FromBody]AuthDto authDto)
        {
            var author = _authorService.Authenticate(authDto.Username, authDto.Password);

            if (author == null)
            {
                var errorMessage = "Username or password is incorrect.";
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage
                });
            }
            else if (!author.IsDeleted.HasValue || author.IsDeleted.Value)
            {
                var errorMessage = "This username has been permanently deactiviated.";
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage
                });
            }
            else if (!author.IsLocked.HasValue || author.IsLocked.Value)
            {
                var errorMessage = "This user has been locked.  Please contact system administrator.";
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage
                });
            }

            var tokenExpiration = DateTime.Now.AddDays(7);
            var refreshTokenExpiration = DateTime.Now.AddDays(30);
            var tokenHandler = new JwtSecurityTokenHandler();
            var keyBytes = Encoding.ASCII.GetBytes(_authConfig.Secret);
            var securityKey = new SymmetricSecurityKey(keyBytes);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Issuer = _authConfig.Issuer,
                Audience = _authConfig.Audience,
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.NameIdentifier, author.AuthorId.ToString()),
                    new Claim(ClaimTypes.Expiration, tokenExpiration.ToString())
                }),
                Expires = tokenExpiration,
                SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature),
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var responseDto = _mapper.Map<AuthResponseDto>(author);
            responseDto.Token = tokenHandler.WriteToken(token);
            responseDto.TokenExpirationDate = tokenExpiration;
            responseDto.RefreshTokenExpirationDate = refreshTokenExpiration;
            responseDto.RefreshToken = _authorService.EncodeRefreshToken(author.Username, refreshTokenExpiration);

            return Ok(responseDto);
        }

        [AllowAnonymous]
        [HttpPost("refresh")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Refresh([FromBody]RefreshDto refreshDto)
        {
            try
            {
                var isTokenValid = _authorService.ValidateRefreshToken(refreshDto.RefreshToken, out DecodedRefreshTokenClaims decodedRefreshTokenClaims, out Author author);

                if (decodedRefreshTokenClaims.ExpiryDate < DateTime.Now)
                {
                    var errorMessage = "Refresh token has expired.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage
                    });
                }
                else if (!isTokenValid)
                {
                    var errorMessage = "Invalid refresh token.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage
                    });
                }
                else if (author == null)
                {
                    var errorMessage = "Unable to identify user associated to the refresh token provided.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage
                    });
                }
                else if (!author.IsDeleted.HasValue || author.IsDeleted.Value)
                {
                    var errorMessage = "This username has been permanently deactivated.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage
                    });
                }
                else if (!author.IsLocked.HasValue || author.IsLocked.Value)
                {
                    var errorMessage = "This user has been locked.  Please contact system administrator.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage
                    });
                }

                var tokenExpiration = DateTime.Now.AddDays(7);
                var refreshTokenExpiration = DateTime.Now.AddDays(183);
                var tokenHandler = new JwtSecurityTokenHandler();
                var keyBytes = Encoding.ASCII.GetBytes(_authConfig.Secret);
                var securityKey = new SymmetricSecurityKey(keyBytes);
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Issuer = _authConfig.Issuer,
                    Audience = _authConfig.Audience,
                    Subject = new ClaimsIdentity(new Claim[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, author.AuthorId.ToString()),
                        new Claim(ClaimTypes.Expiration, tokenExpiration.ToString())
                    }),
                    Expires = tokenExpiration,
                    SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature),
                };
                var token = tokenHandler.CreateToken(tokenDescriptor);
                var responseDto = _mapper.Map<RefreshResponseDto>(author);
                responseDto.Token = tokenHandler.WriteToken(token);
                responseDto.TokenExpirationDate = tokenExpiration;
                responseDto.RefreshTokenExpirationDate = refreshTokenExpiration;
                responseDto.RefreshToken = _authorService.EncodeRefreshToken(author.Username, refreshTokenExpiration);

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to satisfy refreshToken claim.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex));
            }
        }

        [AllowAnonymous]
        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        // public async Task<IActionResult> Create([FromBody]CreateUserDto userDto)
        public IActionResult Create([FromBody]CreateUserDto userDto)
        {
            var author = _authorService.Create(userDto.Username, userDto.Email, userDto.Password, userDto.FirstName, userDto.MiddleName, userDto.LastName);

            if (author == null)
            {
                return BadRequest(new ErrorResponseDto
                {
                    InternalErrorMessage = "Failed to create new user.",
                    DisplayErrorMessage = "Failed to create new user.",
                });
            }

            var createUserResponseDto = _mapper.Map<CreateUserResponseDto>(author);

            // try
            // {
            //     // Notify all subscribers (logged in users) that a new project has been created.
            //     await _userHubContext.Clients
            //         .Groups(Constants.UserSubscriberGroupName)
            //         .SendAsync(Constants.ClientUserNotificationMethodName, new
            //         {
            //             CreatedUserDto = createUserResponseDto,
            //         });
            // }
            // catch (Exception ex)
            // {
            //     Console.WriteLine($"Encountered excetpion while attempting to publish user creation to subscribers.  Message: {ex.Message}");
            //     Console.WriteLine(ex.StackTrace);
            // }

            return Ok(createUserResponseDto);
        }

        [HttpPost("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateUserDto userDto)
        {
            if (_httpContextAccessor.GetCurrentUserId() != userDto.AuthorId)
            {
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = "Specified userId does not match the authenticated userId.",
                    DisplayErrorMessage = "You are not authorized to update user profile.",
                });
            }

            var author = _authorService.UpdateProfile(userDto.AuthorId, userDto.Username, userDto.Email, userDto.FirstName, userDto.MiddleName, userDto.LastName);

            if (author == null)
            {
                var errorMessage = "Failed to update user.";
                return BadRequest(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage,
                });
            }

            return Ok(_mapper.Map<UpdateUserResponseDto>(author));
        }

        [HttpPost("password")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Password([FromBody]UpdatePasswordDto userDto)
        {
            if (_httpContextAccessor.GetCurrentUserId() != userDto.AuthorId)
            {
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = "Specified userId does not match the authenticated userId.",
                    DisplayErrorMessage = "You are not authorized to update user password.",
                });
            }

            var author = _authorService.UpdatePassword(userDto.AuthorId, userDto.Password);

            if (author == null)
            {
                return BadRequest(new ErrorResponseDto
                {
                    InternalErrorMessage = "Authenticated userId matched the specified userId, but the user has since disappeared from the database.",
                    DisplayErrorMessage = "Failed to udpate password.",
                });
            }

            return Ok(_mapper.Map<UpdateUserResponseDto>(author));
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteUserDto userDto)
        {
            if (_httpContextAccessor.GetCurrentUserId() != userDto.AuthorId)
            {
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = "Specified userId does not match the authenticated userId.",
                    DisplayErrorMessage = "You are not authorized to delete user account.",
                });
            }

            var result = _authorService.Delete(userDto.AuthorId);

            if (result)
                return Ok();
            else
                return NoContent();
        }
    }
}
