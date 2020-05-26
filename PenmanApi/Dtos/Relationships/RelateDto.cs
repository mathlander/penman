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

        [Required]
        public Guid LeftClientId { get; set; }

        [Required]
        public Guid RightClientId { get; set; }

        public override string ToString()
        {
            return $"Join: {Join}, LeftId: {LeftId}, RightId: {RightId}, LeftClientId: {LeftClientId}, RightClientId: {RightClientId}";
        }
    }
}
