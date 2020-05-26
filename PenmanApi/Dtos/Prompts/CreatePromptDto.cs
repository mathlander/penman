using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class CreatePromptDto
    {
        [Required]
        public long AuthorId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        [StringLength(100_000_000)]
        public string Body { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}, ClientId: {ClientId}, Title: {Title}, Body: {Body}";
        }
    }
}
