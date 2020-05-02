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
            PersonificationTagJoin = new HashSet<PersonificationTagJoin>();
            Prompt = new HashSet<Prompt>();
            PromptPersonificationJoin = new HashSet<PromptPersonificationJoin>();
            PromptTagJoin = new HashSet<PromptTagJoin>();
            RefreshToken = new HashSet<RefreshToken>();
            Short = new HashSet<Short>();
            ShortPersonificationJoin = new HashSet<ShortPersonificationJoin>();
            ShortPromptJoin = new HashSet<ShortPromptJoin>();
            ShortTagJoin = new HashSet<ShortTagJoin>();
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
        public virtual ICollection<PersonificationTagJoin> PersonificationTagJoin { get; set; }
        public virtual ICollection<Prompt> Prompt { get; set; }
        public virtual ICollection<PromptPersonificationJoin> PromptPersonificationJoin { get; set; }
        public virtual ICollection<PromptTagJoin> PromptTagJoin { get; set; }
        public virtual ICollection<RefreshToken> RefreshToken { get; set; }
        public virtual ICollection<Short> Short { get; set; }
        public virtual ICollection<ShortPersonificationJoin> ShortPersonificationJoin { get; set; }
        public virtual ICollection<ShortPromptJoin> ShortPromptJoin { get; set; }
        public virtual ICollection<ShortTagJoin> ShortTagJoin { get; set; }
        public virtual ICollection<Tag> Tag { get; set; }
        public virtual ICollection<Timeline> Timeline { get; set; }
    }
}
