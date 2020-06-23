using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Relationship
    {
        public long RelationshipId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public Guid ObjectClientId { get; set; }
        public Guid ChipClientId { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool? IsDeleted { get; set; }

        public virtual User User { get; set; }
    }
}
