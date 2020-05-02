using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class DeleteTimelineDto
    {
        [Required]
        public long TimelineId { get; set; }

        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"TimelineId: {TimelineId}, AuthorId: {AuthorId}";
        }
    }
}
