using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class ReadAllTimelinesDto
    {
        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}";
        }
    }
}
