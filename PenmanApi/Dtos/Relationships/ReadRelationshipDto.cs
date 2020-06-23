using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Relationships
{
    [Serializable]
    public class ReadRelationshipDto
    {
        [Required]
        public long RelationshipId { get; set; }

        public override string ToString()
        {
            return $"RelationshipId: {RelationshipId}";
        }
    }
}
