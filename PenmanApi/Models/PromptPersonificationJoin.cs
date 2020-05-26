using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class PromptPersonificationJoin
    {
        public long PromptId { get; set; }
        public long PersonificationId { get; set; }
        public long AuthorId { get; set; }
        public Guid PromptClientId { get; set; }
        public Guid PersonificationClientId { get; set; }

        public virtual Author Author { get; set; }
        public virtual Personification Personification { get; set; }
        public virtual Prompt Prompt { get; set; }
    }
}
