using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Shorts
{
    [Serializable]
    public class UpdateShortDto
    {
        [Required]
        public long ShortId { get; set; }

        [Required]
        public long AuthorId { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        [Required]
        [StringLength(100_000_000)]
        public string Body { get; set; }

        [Required]
        public DateTime EventStart { get; set; }

        [Required]
        public DateTime EventEnd { get; set; }

        public override string ToString()
        {
            return $"ShortId: {ShortId}, AuthorId: {AuthorId}, Title: {Title}, EventStart: {EventStart}, EventEnd: {EventEnd}, Body: {Body}";
        }
    }
}
