using System;

namespace PenmanApi.Dtos.Relationships
{
    [Serializable]
    public class RelationshipResponseDto
    {
        public long RelationshipId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public Guid ObjectClientId { get; set; }
        public Guid ChipClientId { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsDeleted { get; set; }

        public override string ToString()
        {
            return $"RelationshipId: {RelationshipId}, UserId: {UserId}, ClientId: {ClientId}, ObjectClientId: {ChipClientId}, ChipClientId: {ChipClientId}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, IsDeleted: {IsDeleted}";
        }
    }
}
