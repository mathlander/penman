using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class PersonificationTagJoin
    {
        public long PersonificationId { get; set; }
        public long TagId { get; set; }
        public long AuthorId { get; set; }

        public virtual Author Author { get; set; }
        public virtual Personification Personification { get; set; }
        public virtual Tag Tag { get; set; }
    }
}
