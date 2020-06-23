using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class DeleteChapterDto
    {
        [Required]
        public long ChapterId { get; set; }

        public override string ToString()
        {
            return $"ChapterId: {ChapterId}";
        }
    }
}
