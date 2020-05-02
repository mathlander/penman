using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class ShortPromptJoin
    {
        public long ShortId { get; set; }
        public long PromptId { get; set; }
        public long AuthorId { get; set; }

        public virtual Author Author { get; set; }
        public virtual Prompt Prompt { get; set; }
        public virtual Short Short { get; set; }
    }
}
