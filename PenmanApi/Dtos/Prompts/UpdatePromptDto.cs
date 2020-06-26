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
        public long UserId { get; set; }

        [Required]
        public DateTime EventStartDate { get; set; }

        [Required]
        public DateTime EventEndDate { get; set; }

        [Required]
        [StringLength(50)]
        public string Title { get; set; }

        [Required]
        [StringLength(100_000_000)]
        public string Body { get; set; }

        public override string ToString()
        {
            return $"PromptId: {PromptId}, UserId: {UserId}, EventStartDate: {EventStartDate}, EventEndDate: {EventEndDate}, Title: {Title}, Body: {Body}";
        }
    }
}
