using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class UpdateTimelineDto
    {
        [Required]
        public long TimelineId { get; set; }

        [Required]
        public long AuthorId { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        [Required]
        public DateTime EventStart { get; set; }

        [Required]
        public DateTime EventEnd { get; set; }

        public override string ToString()
        {
            return $"TimelineId: {TimelineId}, AuthorId: {AuthorId}, Title: {Title}, EventStart: {EventStart}, EventEnd: {EventEnd}";
        }
    }
}
