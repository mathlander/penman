using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class CreateChapterDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        public long BookId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        public DateTime EventStart { get; set; }

        [Required]
        public DateTime EventEnd { get; set; }

        [Required]
        public int SortOrder { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        [StringLength(100_000_000)]
        public string Body { get; set; }

        public override string ToString()
        {
            return $"UserId: {UserId}, ClientId: {ClientId}, BookId: {BookId}, EventStart: {EventStart}, EventEnd: {EventEnd}, SortOrder: {SortOrder}, Title: {Title}, Body: {Body}";
        }
    }
}
