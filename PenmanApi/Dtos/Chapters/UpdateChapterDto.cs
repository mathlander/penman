using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class UpdateChapterDto
    {
        [Required]
        public long ChapterId { get; set; }

        [Required]
        public long AuthorId { get; set; }

        [Required]
        public long BookId { get; set; }

        public long? TimelineId { get; set; }

        [Required]
        public int SortOrder { get; set; }

        [Required]
        public string Title { get; set; }

        public override string ToString()
        {
            return $"ChapterId: {ChapterId}, AuthorId: {AuthorId}, BookId: {BookId}, TimelineId: {TimelineId}, SortOrder: {SortOrder}, Title: {Title}";
        }
    }
}
