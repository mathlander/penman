using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Short
    {
        public long ShortId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public DateTime EventStart { get; set; }
        public DateTime EventEnd { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool? IsDeleted { get; set; }

        public virtual User User { get; set; }
    }
}
