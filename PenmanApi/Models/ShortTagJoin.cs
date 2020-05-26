using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class ShortTagJoin
    {
        public long ShortId { get; set; }
        public long TagId { get; set; }
        public long AuthorId { get; set; }
        public Guid ShortClientId { get; set; }
        public Guid TagClientId { get; set; }

        public virtual Author Author { get; set; }
        public virtual Short Short { get; set; }
        public virtual Tag Tag { get; set; }
    }
}
