using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace PenmanApi
{
    public static class PasswordHelper
    {
        private static readonly RNGCryptoServiceProvider _randomNumberGenerator = new RNGCryptoServiceProvider();

        public static byte[] GenerateInitialVector()
        {
            var initialVector = new byte[Constants.InitialVectorLength];
            _randomNumberGenerator.GetBytes(initialVector);

            return initialVector;
        }

        public static byte[] GenerateAesKey()
        {
            var aesKey = new byte[Constants.AesKeyLength];
            _randomNumberGenerator.GetBytes(aesKey);

            return aesKey;
        }

        public static byte[] GenerateSalt()
        {
            var salt = new byte[Constants.SaltLength];
            _randomNumberGenerator.GetBytes(salt);

            return salt;
        }

        public static byte[] GeneratePasswordHash(string password, byte[] salt)
        {
            if (String.IsNullOrWhiteSpace(password))
                throw new Exception("Password may not be null or whitespace.");

            byte[] computedHash;
            using (var sha512 = SHA512.Create())
            {
                var inputArray = Enumerable.Concat(salt, Encoding.Unicode.GetBytes(password)).ToArray();
                computedHash = sha512.ComputeHash(inputArray);
            }

            return computedHash;
        }

        public static bool VerifyPassword(string password, byte[] salt, byte[] storedHash)
        {
            if (String.IsNullOrWhiteSpace(password))
                return false;

            var currentHash = GeneratePasswordHash(password, salt);
            return currentHash.SequenceEqual(storedHash);
        }
    }
}
