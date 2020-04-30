using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.Cryptography;
using System.Text;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class AuthorService : IAuthorService
    {
        private readonly PenmanContext _dbContext;
        private readonly BinaryFormatter _binaryFormatter;

        public AuthorService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
            _binaryFormatter = new BinaryFormatter();
        }

        public Author Authenticate(string username, string password)
        {
            Console.WriteLine($"Attempting to authenticate username [{username}] with password [{password.Length}].");
            var author = _dbContext.Author.Where(a => a.Username == username).FirstOrDefault();

            if (author == null)
                return null;
            else if (!PasswordHelper.VerifyPassword(password, author.PasswordSalt, author.PasswordHash))
            {
                Console.WriteLine($"Password verification for user [{username}] failed.");
                return null;
            }

            return author;
        }

        public string EncodeRefreshToken(string username, DateTime expiryDate)
        {
            var author = Read(username);
            var previousTokens = _dbContext.RefreshToken
                .Where(token => token.AuthorId == author.AuthorId && token.IsRevoked.HasValue && !token.IsRevoked.Value)
                .ToList();
            foreach (var token in previousTokens)
                token.IsRevoked = true;
            var refreshToken = new RefreshToken
            {
                AuthorId = author.AuthorId,
                RefreshTokenExpiryDate = expiryDate,
                InitialVector = PasswordHelper.GenerateInitialVector(),
                EncryptionKey = PasswordHelper.GenerateAesKey(),
            };
            var refreshTokenEntity = _dbContext.RefreshToken.Add(refreshToken).Entity;
            _dbContext.RefreshToken.UpdateRange(previousTokens);
            _dbContext.SaveChanges();

            var refreshTokenClaims = new DecodedRefreshTokenClaims
            {
                Username = username,
                ExpiryDate = expiryDate,
                Secret = EncryptionHelper.EncryptBytes(BitConverter.GetBytes(refreshToken.RefreshTokenId), refreshToken.EncryptionKey, refreshToken.InitialVector),
            };
            var encodedToken = String.Empty;

            using (var serializerStream = new MemoryStream())
            {
                Console.WriteLine($"{nameof(EncodeRefreshToken)} refreshTokenClaims: [{refreshTokenClaims.ToString()}]");
                _binaryFormatter.Serialize(serializerStream, refreshTokenClaims);
                encodedToken = Convert.ToBase64String(serializerStream.ToArray());
            }

            return encodedToken;
        }

        public bool ValidateRefreshToken(string encodedRefreshToken, out DecodedRefreshTokenClaims refreshTokenClaims, out Author author)
        {
            using (var deserializerStream = new MemoryStream(Convert.FromBase64String(encodedRefreshToken)))
            {
                refreshTokenClaims = (DecodedRefreshTokenClaims)_binaryFormatter.Deserialize(deserializerStream);
                author = null;

                if (refreshTokenClaims.ExpiryDate < DateTime.Now)
                    return false;

                var username = refreshTokenClaims.Username;
                var activeToken = _dbContext.RefreshToken
                    .Include(rt => rt.Author)
                    .Where(rt => rt.Author.Username == username && rt.IsRevoked.HasValue && !rt.IsRevoked.Value)
                    .FirstOrDefault();
                author = activeToken.Author;

                if (activeToken == null)
                    return false;

                Console.WriteLine($"{nameof(ValidateRefreshToken)} refreshTokenClaims: [{refreshTokenClaims}]");
                Console.WriteLine($"{nameof(ValidateRefreshToken)} EncryptionKey: [{BitConverter.ToString(activeToken.EncryptionKey)}], InitialVector: [{BitConverter.ToString(activeToken.InitialVector)}]");
                var decryptedBytes = EncryptionHelper.DecryptBytes(refreshTokenClaims.Secret, activeToken.EncryptionKey, activeToken.InitialVector);
                var decryptedSecret = BitConverter.ToInt64(decryptedBytes);
                Console.WriteLine($"{nameof(ValidateRefreshToken)} ActiveRefreshTokenId: {activeToken.RefreshTokenId}, DecryptedTokenId: {decryptedSecret}");

                if (activeToken.RefreshTokenId == decryptedSecret)
                    return true;
            }

            return false;
        }

        public Author Create(string username, string email, string password, string firstName, string middleName, string lastName)
        {
            var salt = PasswordHelper.GenerateSalt();
            var passwordHash = PasswordHelper.GeneratePasswordHash(password, salt);
            var author = new Author
            {
                Username = username,
                Email = email,
                PasswordHash = passwordHash,
                PasswordSalt = salt,
                FirstName = firstName,
                MiddleName = middleName,
                LastName = lastName,
            };
            var authorEntity = _dbContext.Author.Add(author).Entity;
            _dbContext.SaveChanges();

            return authorEntity;
        }

        public Author Read(long authorId)
        {
            return _dbContext.Author
                .Where(a => a.AuthorId == authorId)
                .FirstOrDefault();
        }

        public Author Read(string username)
        {
            return _dbContext.Author
                .Where(a => a.Username == username)
                .FirstOrDefault();
        }

        public Author UpdateProfile(long authorId, string username, string email, string firstName, string middleName, string lastName)
        {
            var author = Read(authorId);
            author.Username = username;
            author.Email = email;
            author.FirstName = firstName;
            author.MiddleName = middleName;
            author.LastName = lastName;
            _dbContext.Author.Update(author);
            _dbContext.SaveChanges();

            return author;
        }

        public Author UpdatePassword(long authorId, string password)
        {
            var salt = PasswordHelper.GenerateSalt();
            var passwordHash = PasswordHelper.GeneratePasswordHash(password, salt);
            var author = Read(authorId);
            author.PasswordHash = passwordHash;
            author.PasswordSalt = salt;
            _dbContext.Author.Update(author);
            _dbContext.SaveChanges();

            return author;
        }

        public bool Delete(long authorId)
        {
            var author = Read(authorId);
            author.IsDeleted = true;
            _dbContext.Author.Update(author);
            _dbContext.SaveChanges();

            return true;
        }
    }
}
