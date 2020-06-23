using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Relationships
{
    [Serializable]
    public class CreateRelationshipDto
    {
        [Required]
        public long UserId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        public Guid ObjectClientId { get; set; }

        [Required]
        public Guid ChipClientId { get; set; }

        public override string ToString()
        {
            return $"UserId: {UserId}, ClientId: {ClientId}, ObjectClientId: {ChipClientId}, ChipClientId: {ChipClientId}";
        }
    }
}
