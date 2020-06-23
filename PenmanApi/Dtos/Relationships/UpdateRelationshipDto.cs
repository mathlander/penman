using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Relationships
{
    [Serializable]
    public class UpdateRelationshipDto
    {
        [Required]
        public long RelationshipId { get; set; }

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
            return $"RelationshipId: {RelationshipId}, UserId: {UserId}, ClientId: {ClientId}, ObjectClientId: {ObjectClientId}, ChipClientId: {ChipClientId}";
        }
    }
}
