using System;
using System.IO;
using System.Security.Cryptography;

namespace PenmanApi
{
    public static class EncryptionHelper
    {
        private static readonly Aes _aes;

        static EncryptionHelper()
        {
            _aes = Aes.Create();
            _aes.Padding = PaddingMode.PKCS7;
        }

        public static byte[] EncryptBytes(byte[] clearBytes, byte[] key, byte[] initialVector)
        {
            if (clearBytes == null || clearBytes.Length == 0)
                throw new ArgumentNullException(nameof(clearBytes));

            byte[] encryptedBytes = null;
            using (var encryptor = _aes.CreateEncryptor(key, initialVector))
            using (var memoryStream = new MemoryStream())
            using (var cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write))
            using (var streamWriter = new BinaryWriter(cryptoStream))
            {
                streamWriter.Write(clearBytes);
                streamWriter.Close();
                encryptedBytes = memoryStream.ToArray();
            }

            return encryptedBytes;
        }

        public static byte[] DecryptBytes(byte[] cipher, byte[] key, byte[] initialVector)
        {
            if (cipher == null || cipher.Length == 0)
                throw new ArgumentNullException(nameof(cipher));

            var decryptedByteCount = 0;
            var decryptedBytes = new byte[cipher.Length];
            using (var decryptor = _aes.CreateDecryptor(key, initialVector))
            using (var memoryStream = new MemoryStream())
            using (var cryptoStream = new CryptoStream(memoryStream, decryptor, CryptoStreamMode.Read))
            using (var streamReader = new BinaryReader(cryptoStream))
            {
                var sizeOfBuffer = 1024;
                var buffer = new byte[sizeOfBuffer];
                for (var index = 0; index < cipher.Length; index += sizeOfBuffer)
                {
                    var bytesRead = streamReader.Read(buffer, index, sizeOfBuffer);
                    Array.Copy(buffer, index, decryptedBytes, index, bytesRead);
                    decryptedByteCount += bytesRead;
                }
            }

            var clearBytes = new byte[decryptedByteCount];
            Array.Copy(decryptedBytes, clearBytes, decryptedByteCount);

            return clearBytes;
        }
    }
}
