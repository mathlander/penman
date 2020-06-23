using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Shorts
{
    [Serializable]
    public class CreateShortDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        public DateTime EventStart { get; set; }

        [Required]
        public DateTime EventEnd { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        [Required]
        [StringLength(100_000_000)]
        public string Body { get; set; }

        public override string ToString()
        {
            return $"UserId: {UserId}, ClientId: {ClientId}, EventStart: {EventStart}, EventEnd: {EventEnd}, Title: {Title}, Body: {Body}";
        }
    }
}
