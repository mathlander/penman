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
        public long AuthorId { get; set; }

        public long? TimelineId { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        public override string ToString()
        {
            return $"BookId: {BookId}, AuthorId: {AuthorId}, TimelineId: {TimelineId}, Title: {Title}";
        }
    }
}
