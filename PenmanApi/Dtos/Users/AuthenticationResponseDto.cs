using System;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class AuthenticationResponseDto
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public DateTime TokenExpirationDate { get; set; }
        public DateTime RefreshTokenExpirationDate { get; set; }
        public ProfileResponseDto Profile { get; set; }

        public override string ToString()
        {
            return $"Token: {Token}, RefreshToken: {RefreshToken}, TokenExpirationDate: {TokenExpirationDate}, RefreshTokenExpirationDate: {RefreshTokenExpirationDate}, Profile: {Profile}";
        }
    }
}
