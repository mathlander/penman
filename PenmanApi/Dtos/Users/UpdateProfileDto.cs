using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class UpdateProfileDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string Username { get; set; }

        [Required]
        [StringLength(320)]
        [RegularExpression("^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$", MatchTimeoutInMilliseconds = 1500, ErrorMessage = "Must be a valid email")]
        public string Email { get; set; }

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
            return $"UserId: {UserId}, Username: {Username}, Email: {Email}, FirstName: {FirstName}, MiddleName: {MiddleName}, LastName: {LastName}";
        }
    }
}
