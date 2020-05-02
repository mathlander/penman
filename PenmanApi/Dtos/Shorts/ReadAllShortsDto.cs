using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Shorts
{
    [Serializable]
    public class ReadAllShortsDto
    {
        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}";
        }
    }
}
