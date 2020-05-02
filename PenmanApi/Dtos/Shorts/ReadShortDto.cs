using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Shorts
{
    [Serializable]
    public class ReadShortDto
    {
        [Required]
        public long ShortId { get; set; }

        public override string ToString()
        {
            return $"ShortId: {ShortId}";
        }
    }
}
