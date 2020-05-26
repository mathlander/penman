using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class CreateTimelineDto
    {
        [Required]
        public long AuthorId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        [Required]
        public DateTime EventStart { get; set; }

        [Required]
        public DateTime EventEnd { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}, ClientId: {ClientId}, Title: {Title}, EventStart: {EventStart}, EventEnd: {EventEnd}";
        }
    }
}
