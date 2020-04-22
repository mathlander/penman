using System;

namespace PenmanApi
{
    internal static class Constants
    {
        // Salt for SHA hashing algorithm is the same length as the spec, so for the SHA512
        // the salt is the 512 bits (64 bytes).
        public const int SaltLength = 64;
        public const int PasswordLength = 64;
        public const int InitialVectorLength = 16;
        public const int AesKeyLength = 16;
    }
}
