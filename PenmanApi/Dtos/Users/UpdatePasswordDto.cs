using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class UpdatePasswordDto
    {
        [Required]
        public long AuthorId { get; set; }

        [Required]
        [StringLength(64, ErrorMessage = "Password must be between 6 and 64 characters.", MinimumLength = 6)]
        public string Password { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}, Password: [{Password.Length} characters]";
        }
    }
}
