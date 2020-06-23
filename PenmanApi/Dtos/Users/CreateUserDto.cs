using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class CreateUserDto
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; }

        [Required]
        [StringLength(320)]
        [RegularExpression("^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$", MatchTimeoutInMilliseconds = 1500, ErrorMessage = "Must be a valid email")]
        public string Email { get; set; }

        [Required]
        [StringLength(64, ErrorMessage = "Password must be between 6 and 64 characters.", MinimumLength = 6)]
        public string Password { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(50)]
        public string MiddleName { get; set; }

        [Required]
        [StringLength(50)]
        public string LastName { get; set; }

        public override string ToString()
        {
            return $"Username: {Username}, Email: {Email}, Password: [{Password.Length} characters], FirstName: {FirstName}, MiddleName: {MiddleName}, LastName: {LastName}";
        }
    }
}
