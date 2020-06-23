using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using PenmanApi.Config;
using PenmanApi.Dtos;
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
        private readonly IUserService _userService;

        public UsersController(IMapper mapper, IHttpContextAccessor httpContextAccessor, IAuthConfig authConfig, IUserService userService)
        {
            _mapper = mapper;
            _httpContextAccessor = httpContextAccessor;
            _authConfig = authConfig;
            _userService = userService;
        }

        [AllowAnonymous]
        [HttpPost("authenticate")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Authenticate([FromBody]AuthDto authDto)
        {
            var user = _userService.Authenticate(authDto.Username, authDto.Password);
            if (user == null)
            {
                var errorMessage = "Username or password is incorrect.";
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage,
                    ErrorCode = (int)ErrorCodes.AuthenticationFailed,
                });
            }
            else if (!user.IsDeleted.HasValue || user.IsDeleted.Value)
            {
                var errorMessage = "This user account has been permanently deactivated.";
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage,
                    ErrorCode = (int)ErrorCodes.AccountDeleted,
                });
            }
            else if (!user.IsLocked.HasValue || user.IsLocked.Value)
            {
                var errorMessage = "This user account has been locked.  Please contact the system administrator";
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage,
                    ErrorCode = (int)ErrorCodes.AccountLocked,
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
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Expiration, tokenExpiration.ToString()),
                }),
                Expires = tokenExpiration,
                SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature),
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var responseDto = _mapper.Map<AuthResponseDto>(user);
            responseDto.Token = tokenHandler.WriteToken(token);
            responseDto.TokenExpirationDate = tokenExpiration;
            responseDto.RefreshTokenExpirationDate = refreshTokenExpiration;
            responseDto.RefreshToken = _userService.EncodeRefreshToken(user.Username, refreshTokenExpiration, false);

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
                var isTokenValid = _userService.ValidateRefreshToken(refreshDto.RefreshToken, out DecodedRefreshTokenClaims decodedRefreshTokenClaims, out User user);

                if (decodedRefreshTokenClaims.ExpiryDate < DateTime.Now)
                {
                    var errorMessage = "Refresh token has expired.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage,
                        ErrorCode = (int)ErrorCodes.RefreshTokenExpired,
                    });
                }
                else if (!isTokenValid)
                {
                    var errorMessage = "Invalid refresh token.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage,
                        ErrorCode = (int)ErrorCodes.InvalidRefreshToken,
                    });
                }
                else if (user == null)
                {
                    var errorMessage = "Unable to identify user associated to the refresh token provided.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage,
                        ErrorCode = (int)ErrorCodes.AuthenticationFailed,
                    });
                }
                else if (!user.IsDeleted.HasValue || user.IsDeleted.Value)
                {
                    var errorMessage = "This usern account has been permanently deactivated.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage,
                        ErrorCode = (int)ErrorCodes.AccountDeleted,
                    });
                }
                else if (!user.IsLocked.HasValue || user.IsLocked.Value)
                {
                    var errorMessage = "This user account has been locked.  Please contact the system administrator.";
                    return Unauthorized(new ErrorResponseDto
                    {
                        InternalErrorMessage = errorMessage,
                        DisplayErrorMessage = errorMessage,
                        ErrorCode = (int)ErrorCodes.AccountLocked,
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
                        new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                        new Claim(ClaimTypes.Expiration, tokenExpiration.ToString()),
                    }),
                    Expires = tokenExpiration,
                    SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature),
                };
                var token = tokenHandler.CreateToken(tokenDescriptor);
                var responseDto = _mapper.Map<AuthResponseDto>(user);
                responseDto.Token = tokenHandler.WriteToken(token);
                responseDto.TokenExpirationDate = tokenExpiration;
                responseDto.RefreshTokenExpirationDate = refreshTokenExpiration;
                responseDto.RefreshToken = _userService.EncodeRefreshToken(user.Username, refreshTokenExpiration, false);

                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to satisfy refreshToken claim.  Message: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return BadRequest(new ErrorResponseDto(ex) { ErrorCode = (int) ErrorCodes.Unknown });
            }
        }

        [AllowAnonymous]
        [HttpPost("create")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Create([FromBody]CreateUserDto userDto)
        {
            var user = _userService.Create(userDto.Username, userDto.Email, userDto.Password, userDto.FirstName, userDto.MiddleName, userDto.LastName);

            if (user == null)
            {
                var errorMessage = "Failed to create new user.";
                return BadRequest(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage,
                    ErrorCode = (int)ErrorCodes.Unknown,
                });
            }

            // The user was created, generate an auth token so they can now access the protected regions of the site
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
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Expiration, tokenExpiration.ToString()),
                }),
                Expires = tokenExpiration,
                SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature),
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var responseDto = _mapper.Map<AuthResponseDto>(user);
            responseDto.Token = tokenHandler.WriteToken(token);
            responseDto.TokenExpirationDate = tokenExpiration;
            responseDto.RefreshTokenExpirationDate = refreshTokenExpiration;
            responseDto.RefreshToken = _userService.EncodeRefreshToken(user.Username, refreshTokenExpiration, false);

            return Ok(responseDto);
        }

        [HttpPatch("update")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Update([FromBody]UpdateProfileDto userDto)
        {
            if (_httpContextAccessor.GetCurrentUserId() != userDto.UserId)
            {
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = "The specified userId does not match the authenticated userId.",
                    DisplayErrorMessage = "The requested action was not authorized.",
                    ErrorCode = (int)ErrorCodes.UnauthorizedAction,
                });
            }

            var user = _userService.UpdateProfile(userDto.UserId, userDto.Username, userDto.Email, userDto.FirstName, userDto.MiddleName, userDto.LastName);
            if (user == null)
            {
                var errorMessage = "The request to update the user has failed.";
                return BadRequest(new ErrorResponseDto
                {
                    InternalErrorMessage = errorMessage,
                    DisplayErrorMessage = errorMessage,
                    ErrorCode = (int)ErrorCodes.Unknown,
                });
            }

            return Ok(_mapper.Map<UpdateUserResponseDto>(user));
        }

        [HttpPatch("password")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Password([FromBody]UpdatePasswordDto userDto)
        {
            if (_httpContextAccessor.GetCurrentUserId() != userDto.UserId)
            {
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = "Specified userId does not match the authenticated userId.",
                    DisplayErrorMessage = "The requested action was not authorized.",
                    ErrorCode = (int)ErrorCodes.UnauthorizedAction,
                });
            }

            var user = _userService.UpdatePassword(userDto.UserId, userDto.Password);
            if (user == null)
            {
                return BadRequest(new ErrorResponseDto
                {
                    InternalErrorMessage = "The authenticated userId matched the specified userId, but the user has since disappered from the database.",
                    DisplayErrorMessage = "The server was unable to process the requested action.",
                    ErrorCode = (int)ErrorCodes.Unknown,
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
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Expiration, tokenExpiration.ToString()),
                }),
                Expires = tokenExpiration,
                SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256Signature),
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var responseDto = _mapper.Map<AuthResponseDto>(user);
            responseDto.Token = tokenHandler.WriteToken(token);
            responseDto.TokenExpirationDate = tokenExpiration;
            responseDto.RefreshTokenExpirationDate = refreshTokenExpiration;
            responseDto.RefreshToken = _userService.EncodeRefreshToken(user.Username, refreshTokenExpiration, true);

            return Ok(responseDto);
        }

        [HttpDelete("delete")]
        [Produces("application/json")]
        public IActionResult Delete([FromQuery]DeleteUserDto userDto)
        {
            if (_httpContextAccessor.GetCurrentUserId() != userDto.UserId)
            {
                return Unauthorized(new ErrorResponseDto
                {
                    InternalErrorMessage = "The specified userId does not match the authenticated userId.",
                    DisplayErrorMessage = "You requested action was not authorized.",
                    ErrorCode = (int)ErrorCodes.UnauthorizedAction,
                });
            }

            var result = _userService.Delete(userDto.UserId);

            if (result)
                return Ok();
            else
                return NoContent();
        }
    }
}
