using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class UpdatePromptDto
    {
        [Required]
        public long PromptId { get; set; }

        [Required]
        public long AuthorId { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        [Required]
        [StringLength(100_000_000)]
        public string Body { get; set; }

        public override string ToString()
        {
            return $"PromptId: {PromptId}, AuthorId: {AuthorId}, Title: {Title}, Body: {Body}";
        }
    }
}
