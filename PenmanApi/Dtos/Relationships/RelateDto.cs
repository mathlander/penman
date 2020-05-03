using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Relationships
{
    [Serializable]
    public class RelateDto
    {
        [Required]
        [StringLength(100)]
        public string Join { get; set; }

        [Required]
        public long LeftId { get; set; }

        [Required]
        public long RightId { get; set; }

        public override string ToString()
        {
            return $"Join: {Join}, LeftId: {LeftId}, RightId: {RightId}";
        }
    }
}
