using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class ShortPersonificationJoin
    {
        public long ShortId { get; set; }
        public long PersonificationId { get; set; }

        public virtual Personification Personification { get; set; }
        public virtual Short Short { get; set; }
    }
}
