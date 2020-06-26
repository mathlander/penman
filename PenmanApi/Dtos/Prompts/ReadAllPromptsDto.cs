using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class ReadAllPromptsDto
    {
        [Required]
        public long UserId { get; set; }

        public DateTime? LastReadAllDate { get; set; }

        public override string ToString()
        {
            var readAll = LastReadAllDate.HasValue ? LastReadAllDate.Value.ToString() : "never";
            return $"UserId: {UserId}, LastReadAllDate: {readAll}";
        }
    }
}
