using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class ReadAllPromptsDto
    {
        [Required]
        public long UserId { get; set; }

        public DateTime? LastReadAll { get; set; }

        public override string ToString()
        {
            var readAll = LastReadAll.HasValue ? LastReadAll.Value.ToString() : "never";
            return $"UserId: {UserId}, LastReadAll: {readAll}";
        }
    }
}
