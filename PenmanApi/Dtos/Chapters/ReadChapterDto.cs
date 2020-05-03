using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class ReadChapterDto
    {
        [Required]
        public long ChapterId { get; set; }

        public override string ToString()
        {
            return $"ChapterId: {ChapterId}";
        }
    }
}
