using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Book
    {
        public Book()
        {
            Chapter = new HashSet<Chapter>();
        }

        public long BookId { get; set; }
        public long AuthorId { get; set; }
        public Guid ClientId { get; set; }
        public long? TimelineId { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
        public virtual Timeline Timeline { get; set; }
        public virtual ICollection<Chapter> Chapter { get; set; }
    }
}
