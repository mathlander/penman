using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class ReadAllChaptersDto
    {
        [Required]
        public long AuthorId { get; set; }

        [Required]
        public long BookId { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}, BookId: {BookId}";
        }
    }
}
