using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class PromptTagJoin
    {
        public long PromptId { get; set; }
        public long TagId { get; set; }
        public long AuthorId { get; set; }
        public Guid PromptClientId { get; set; }
        public Guid TagClientId { get; set; }

        public virtual Author Author { get; set; }
        public virtual Prompt Prompt { get; set; }
        public virtual Tag Tag { get; set; }
    }
}
