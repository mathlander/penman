using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class DeleteUserDto
    {
        [Required]
        public long UserId { get; set; }

        public override string ToString()
        {
            return $"UserId: {UserId}";
        }
    }
}
