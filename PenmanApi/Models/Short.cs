using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Short
    {
        public Short()
        {
            ShortPersonificationJoin = new HashSet<ShortPersonificationJoin>();
            ShortPromptJoin = new HashSet<ShortPromptJoin>();
            ShortTagJoin = new HashSet<ShortTagJoin>();
        }

        public long ShortId { get; set; }
        public long AuthorId { get; set; }
        public string Body { get; set; }
        public string Title { get; set; }
        public DateTime EventStart { get; set; }
        public DateTime EventEnd { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
        public virtual ICollection<ShortPersonificationJoin> ShortPersonificationJoin { get; set; }
        public virtual ICollection<ShortPromptJoin> ShortPromptJoin { get; set; }
        public virtual ICollection<ShortTagJoin> ShortTagJoin { get; set; }
    }
}
