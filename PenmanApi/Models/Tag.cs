using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Tag
    {
        public long TagId { get; set; }
        public long AuthorId { get; set; }
        public string TagName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
    }
}
