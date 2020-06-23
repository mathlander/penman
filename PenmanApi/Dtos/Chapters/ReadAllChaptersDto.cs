using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class ReadAllChaptersDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        public long BookId { get; set; }

        public DateTime? LastReadAll { get; set; }

        public override string ToString()
        {
            var readAll = LastReadAll.HasValue ? LastReadAll.Value.ToString() : "never";
            return $"UserId: {UserId}, BookId: {BookId}, LastReadAll: {readAll}";
        }
    }
}
