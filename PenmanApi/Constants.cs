using System;

namespace PenmanApi
{
    internal static class Constants
    {
        /* SHA Hashing */
        // The salt for a SHA hash is the same length as the output value, i.e.
        // for SHA512 the salt should be 512 bits (64 bytes).
        public const int SaltLength = 64;
        public const int PasswordLength = 64;

        /* AES Encryption */
        public const int InitialVectorLength = 16;
        public const int AesKeyLength = 16;

        /* WebSockets */
        public const string PenmanHubRoute = "/hubs/penman";
    }
}
