using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class ReadTimelineDto
    {
        [Required]
        public long TimelineId { get; set; }

        public override string ToString()
        {
            return $"TimelineId: {TimelineId}";
        }
    }
}
