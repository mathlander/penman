using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Users
{
    [Serializable]
    public class DeleteUserDto
    {
        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}";
        }
    }
}
