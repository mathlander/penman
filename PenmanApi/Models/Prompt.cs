using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Prompt
    {
        public Prompt()
        {
            PromptPersonificationJoin = new HashSet<PromptPersonificationJoin>();
            PromptTagJoin = new HashSet<PromptTagJoin>();
            ShortPromptJoin = new HashSet<ShortPromptJoin>();
        }

        public long PromptId { get; set; }
        public long AuthorId { get; set; }
        public string Body { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
        public virtual ICollection<PromptPersonificationJoin> PromptPersonificationJoin { get; set; }
        public virtual ICollection<PromptTagJoin> PromptTagJoin { get; set; }
        public virtual ICollection<ShortPromptJoin> ShortPromptJoin { get; set; }
    }
}
