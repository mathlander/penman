using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Personification
    {
        public long PersonificationId { get; set; }
        public long AuthorId { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime Birthday { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
    }
}
