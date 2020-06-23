using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class ReadPromptDto
    {
        [Required]
        public long PromptId { get; set; }

        public override string ToString()
        {
            return $"PromptId: {PromptId}";
        }
    }
}
