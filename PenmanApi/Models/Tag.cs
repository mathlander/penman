using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Tag
    {
        public Tag()
        {
            PersonificationTagJoin = new HashSet<PersonificationTagJoin>();
            PromptTagJoin = new HashSet<PromptTagJoin>();
            ShortTagJoin = new HashSet<ShortTagJoin>();
        }

        public long TagId { get; set; }
        public long AuthorId { get; set; }
        public string TagName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
        public virtual ICollection<PersonificationTagJoin> PersonificationTagJoin { get; set; }
        public virtual ICollection<PromptTagJoin> PromptTagJoin { get; set; }
        public virtual ICollection<ShortTagJoin> ShortTagJoin { get; set; }
    }
}
