using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class ShortTagJoin
    {
        public long ShortId { get; set; }
        public long TagId { get; set; }

        public virtual Short Short { get; set; }
        public virtual Tag Tag { get; set; }
    }
}
