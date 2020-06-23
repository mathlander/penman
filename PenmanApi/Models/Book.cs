using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Book
    {
        public Book()
        {
            Chapters = new HashSet<Chapter>();
        }

        public long BookId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public string Title { get; set; }
        public DateTime? EventStart { get; set; }
        public DateTime? EventEnd { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool? IsDeleted { get; set; }

        public virtual User User { get; set; }
        public virtual ICollection<Chapter> Chapters { get; set; }
    }
}
