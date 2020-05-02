using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Personification
    {
        public Personification()
        {
            PersonificationTagJoin = new HashSet<PersonificationTagJoin>();
            PromptPersonificationJoin = new HashSet<PromptPersonificationJoin>();
            ShortPersonificationJoin = new HashSet<ShortPersonificationJoin>();
        }

        public long PersonificationId { get; set; }
        public long AuthorId { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime Birthday { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
        public virtual ICollection<PersonificationTagJoin> PersonificationTagJoin { get; set; }
        public virtual ICollection<PromptPersonificationJoin> PromptPersonificationJoin { get; set; }
        public virtual ICollection<ShortPersonificationJoin> ShortPersonificationJoin { get; set; }
    }
}
