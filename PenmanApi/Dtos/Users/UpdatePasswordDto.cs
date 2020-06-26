using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class UpdatePasswordDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        [StringLength(64, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 64 characters.")]
        public string Password { get; set; }

        public override string ToString()
        {
            return $"UserId: {UserId}, Password: [{Password.Length} characters]";
        }
    }
}
