using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class DeleteChapterDto
    {
        [Required]
        public long ChapterId { get; set; }

        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"ChapterId: {ChapterId}, AuthorId: {AuthorId}";
        }
    }
}
