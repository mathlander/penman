using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public DateTime TokenExpirationDate { get; set; }
        public DateTime RefreshTokenExpirationDate { get; set; }

        public long AuthorId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"Token: {Token}, RefreshToken: {RefreshToken}, AuthorId: {AuthorId}, Username: {Username}, Email: {Email}, FirstName: {FirstName}, LastName: {LastName}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}
