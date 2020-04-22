using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class Author
    {
        public Author()
        {
            Book = new HashSet<Book>();
            Chapter = new HashSet<Chapter>();
            Personification = new HashSet<Personification>();
            Prompt = new HashSet<Prompt>();
            RefreshToken = new HashSet<RefreshToken>();
            Short = new HashSet<Short>();
            Tag = new HashSet<Tag>();
            Timeline = new HashSet<Timeline>();
        }

        public long AuthorId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public byte[] PasswordHash { get; set; }
        public byte[] PasswordSalt { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool? IsDeleted { get; set; }
        public bool? IsLocked { get; set; }

        public virtual ICollection<Book> Book { get; set; }
        public virtual ICollection<Chapter> Chapter { get; set; }
        public virtual ICollection<Personification> Personification { get; set; }
        public virtual ICollection<Prompt> Prompt { get; set; }
        public virtual ICollection<RefreshToken> RefreshToken { get; set; }
        public virtual ICollection<Short> Short { get; set; }
        public virtual ICollection<Tag> Tag { get; set; }
        public virtual ICollection<Timeline> Timeline { get; set; }
    }
}
