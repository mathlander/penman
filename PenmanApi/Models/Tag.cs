using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Tag
    {
        public long TagId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public string TagName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool? IsDeleted { get; set; }

        public virtual User User { get; set; }
    }
}
