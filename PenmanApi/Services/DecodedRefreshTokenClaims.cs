using System;

namespace PenmanApi.Services
{
    [Serializable]
    public class DecodedRefreshTokenClaims
    {
        public string Username { get; set; }
        public DateTime ExpiryDate { get; set; }
        public byte[] Secret { get; set; }

        public override string ToString()
        {
            var secretString = Secret == null ? String.Empty : BitConverter.ToString(Secret);
            return $"Username: {Username}, ExpiryDate: {ExpiryDate}, Secret: {secretString}";
        }
    }
}
