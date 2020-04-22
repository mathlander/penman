using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Timeline
    {
        public Timeline()
        {
            Book = new HashSet<Book>();
            Chapter = new HashSet<Chapter>();
        }

        public long TimelineId { get; set; }
        public long AuthorId { get; set; }
        public string Title { get; set; }
        public DateTime EventStart { get; set; }
        public DateTime EventEnd { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
        public virtual ICollection<Book> Book { get; set; }
        public virtual ICollection<Chapter> Chapter { get; set; }
    }
}
