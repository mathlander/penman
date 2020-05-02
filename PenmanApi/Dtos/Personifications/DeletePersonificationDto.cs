using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class DeletePersonificationDto
    {
        [Required]
        public long PersonificationId { get; set; }

        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"PersonificationId: {PersonificationId}, AuthorId: {AuthorId}";
        }
    }
}
