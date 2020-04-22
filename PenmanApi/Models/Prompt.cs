using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Prompt
    {
        public long PromptId { get; set; }
        public long AuthorId { get; set; }
        public string Body { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
    }
}
