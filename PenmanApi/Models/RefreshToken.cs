using System;
using System.Collections.Generic;

namespace PenmanApi.Models
{
    public partial class RefreshToken
    {
        public long RefreshTokenId { get; set; }
        public long AuthorId { get; set; }
        public DateTime RefreshTokenExpiryDate { get; set; }
        public byte[] InitialVector { get; set; }
        public byte[] EncryptionKey { get; set; }
        public bool? IsRevoked { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public virtual Author Author { get; set; }
    }
}
