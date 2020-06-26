using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Prompt
    {
        public long PromptId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public DateTime EventStartDate { get; set; }
        public DateTime EventEndDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool? IsDeleted { get; set; }

        public virtual User User { get; set; }
    }
}
