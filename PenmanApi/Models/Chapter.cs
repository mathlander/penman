using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Chapter
    {
        public long ChapterId { get; set; }
        public long AuthorId { get; set; }
        public long BookId { get; set; }
        public long? TimelineId { get; set; }
        public int SortOrder { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
        public virtual Book Book { get; set; }
        public virtual Timeline Timeline { get; set; }
    }
}
