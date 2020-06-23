using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class ReadPersonificationDto
    {
        [Required]
        public long PersonificationId { get; set; }

        public override string ToString()
        {
            return $"PersonificationId: {PersonificationId}";
        }
    }
}
