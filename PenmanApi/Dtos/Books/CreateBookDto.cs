using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class CreateBookDto
    {
        [Required]
        public long AuthorId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        public long? TimelineId { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}, ClientId: {ClientId}, TimelineId: {TimelineId}, Title: {Title}";
        }
    }
}
