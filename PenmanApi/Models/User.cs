using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class User
    {
        public User()
        {
            Books = new HashSet<Book>();
            Chapters = new HashSet<Chapter>();
            Personifications = new HashSet<Personification>();
            Prompts = new HashSet<Prompt>();
            RefreshTokens = new HashSet<RefreshToken>();
            Shorts = new HashSet<Short>();
            Tags = new HashSet<Tag>();
        }

        public long UserId { get; set; }
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

        public virtual ICollection<Book> Books { get; set; }
        public virtual ICollection<Chapter> Chapters { get; set; }
        public virtual ICollection<Personification> Personifications { get; set; }
        public virtual ICollection<Prompt> Prompts { get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; }
        public virtual ICollection<Short> Shorts { get; set; }
        public virtual ICollection<Tag> Tags { get; set; }
    }
}
