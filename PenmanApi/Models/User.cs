using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class User
    {
        public User()
        {
            Prompts = new HashSet<Prompt>();
            RefreshTokens = new HashSet<RefreshToken>();
        }

        public long UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public byte[] PasswordHash { get; set; }
        public byte[] PasswordSalt { get; set; }
        public Guid ClientId { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool? IsDeleted { get; set; }
        public bool? IsLocked { get; set; }

        public virtual ICollection<Prompt> Prompts { get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; }
    }
}
