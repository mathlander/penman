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
    [Route("[controller]")]
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
                return Unauthorized(new { Message = "Username or password is incorrect." });
            else if (!author.IsDeleted.HasValue || author.IsDeleted.Value)
                return Unauthorized(new { Message = "This username has been permanently deactiviated." });
            else if (!author.IsLocked.HasValue || author.IsLocked.Value)
                return Unauthorized(new { Message = "This user has been locked.  Please contact system administrator." });

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
                    return Unauthorized(new { Message = "Refresh token has expired." });
                else if (!isTokenValid)
                    return Unauthorized(new { Message = "Invalid refresh token." });
                else if (author == null)
                    return Unauthorized(new { Message = "Unable to identify user associated to the refresh token provided." });
                else if (!author.IsDeleted.HasValue || author.IsDeleted.Value)
                    return Unauthorized(new { Message = "This username has been permanently deactivated." });
                else if (!author.IsLocked.HasValue || author.IsLocked.Value)
                    return Unauthorized(new { Message = "This user has been locked.  Please contact system administrator." });

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
            }

            return Unauthorized(new { Message = "Failed to generate new authentication token from the provided refresh token." });
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
                return BadRequest(new { Message = "Failed to create new user." });

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
            var author = _authorService.UpdateProfile(userDto.AuthorId, userDto.Username, userDto.Email, userDto.FirstName, userDto.MiddleName, userDto.LastName);

            if (author == null)
                return BadRequest(new { Message = "Failed to update user." });

            return Ok(_mapper.Map<UpdateUserResponseDto>(author));
        }

        [HttpPost("password")]
        [Consumes("application/json")]
        [Produces("application/json")]
        public IActionResult Password([FromBody]UpdatePasswordDto userDto)
        {
            var author = _authorService.UpdatePassword(userDto.AuthorId, userDto.Password);

            if (author == null)
                return BadRequest(new { Message = "Failed to udpate password." });

            return Ok(_mapper.Map<UpdateUserResponseDto>(author));
        }

        [HttpDelete("delete")]
        public IActionResult Delete([FromQuery]DeleteUserDto userDto)
        {
            var result = _authorService.Delete(userDto.AuthorId);

            if (result)
                return Ok();
            else
                return NoContent();
        }
    }
}
