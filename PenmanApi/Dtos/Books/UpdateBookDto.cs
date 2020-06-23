using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class UpdateBookDto
    {
        [Required]
        public long BookId { get; set; }

        [Required]
        public long UserId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        public DateTime? EventStart { get; set; }

        public DateTime? EventEnd { get; set; }

        public override string ToString()
        {
            var eventStart = EventStart.HasValue ? EventStart.Value.ToString() : String.Empty;
            var eventEnd = EventEnd.HasValue ? EventEnd.Value.ToString() : String.Empty;
            return $"BookId: {BookId}, UserId: {UserId}, ClientId: {ClientId}, Title: {Title}, EventStart: {eventStart}, EventEnd: {eventEnd}";
        }
    }
}
