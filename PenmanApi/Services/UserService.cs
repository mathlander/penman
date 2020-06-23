using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Formatters.Binary;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class UserService : IUserService
    {
        private readonly PenmanContext _dbContext;
        private readonly BinaryFormatter _binaryFormatter;

        public UserService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
            _binaryFormatter = new BinaryFormatter();
        }

        public User Read(long userId)
        {
            return _dbContext.Users
                .Where(u => u.UserId == userId)
                .FirstOrDefault();
        }

        public User Read(string username)
        {
            return _dbContext.Users
                .Where(u => u.Username == username)
                .FirstOrDefault();
        }

        public User Authenticate(string username, string password)
        {
            Console.WriteLine($"Attempting to authenticate username [{username}] with password [{password.Length}].");
            var user = _dbContext.Users.Where(a => a.Username == username).FirstOrDefault();

            if (user == null)
                return null;
            else if (!PasswordHelper.VerifyPassword(password, user.PasswordSalt, user.PasswordHash))
            {
                Console.WriteLine($"Password verification for user [{username}] failed.");
                return null;
            }

            return user;
        }

        public string EncodeRefreshToken(string username, DateTime expiryDate, bool invalidateExistingTokens)
        {
            var user = Read(username);
            var previousTokens = _dbContext.RefreshTokens
                .Where(token => token.UserId == user.UserId && token.IsRevoked.HasValue && !token.IsRevoked.Value)
                .ToList();
            foreach(var token in previousTokens)
                token.IsRevoked = true;
            var refreshToken = new RefreshToken
            {
                UserId = user.UserId,
                RefreshTokenExpiryDate = expiryDate,
                InitialVector = PasswordHelper.GenerateInitialVector(),
                EncryptionKey = PasswordHelper.GenerateAesKey(),
            };
            var refreshTokenEntity = _dbContext.RefreshTokens.Add(refreshToken).Entity;
            if (invalidateExistingTokens) _dbContext.RefreshTokens.UpdateRange(previousTokens);
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

        public bool ValidateRefreshToken(string encodedRefreshToken, out DecodedRefreshTokenClaims refreshTokenClaims, out User user)
        {
            using (var deserializerStream = new MemoryStream(Convert.FromBase64String(encodedRefreshToken)))
            {
                refreshTokenClaims = (DecodedRefreshTokenClaims)_binaryFormatter.Deserialize(deserializerStream);
                user = null;

                if (refreshTokenClaims.ExpiryDate < DateTime.Now)
                    return false;

                var username = refreshTokenClaims.Username;
                var activeToken = _dbContext.RefreshTokens
                    .Include(rt => rt.User)
                    .Where(rt => rt.User.Username == username && rt.IsRevoked.HasValue && !rt.IsRevoked.Value)
                    .FirstOrDefault();
                user = activeToken.User;

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

        public User Create(string username, string email, string password, string firstName, string middleName, string lastName)
        {
            var salt = PasswordHelper.GenerateSalt();
            var passwordHash = PasswordHelper.GeneratePasswordHash(password, salt);
            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = passwordHash,
                PasswordSalt = salt,
                FirstName = firstName,
                MiddleName = middleName,
                LastName = lastName,
            };
            var userEntity = _dbContext.Users.Add(user).Entity;
            _dbContext.SaveChanges();

            return userEntity;
        }

        public User UpdateProfile(long userId, string username, string email, string firstName, string middleName, string lastName)
        {
            var user = Read(userId);
            user.Username = username;
            user.Email = email;
            user.FirstName = firstName;
            user.MiddleName = middleName;
            user.LastName = lastName;
            _dbContext.Users.Update(user);
            _dbContext.SaveChanges();

            return user;
        }

        public User UpdatePassword(long userId, string password)
        {
            var salt = PasswordHelper.GenerateSalt();
            var passwordHash = PasswordHelper.GeneratePasswordHash(password, salt);
            var user = Read(userId);
            user.PasswordHash = passwordHash;
            user.PasswordSalt = salt;
            _dbContext.Users.Update(user);
            _dbContext.SaveChanges();

            return user;
        }

        public bool Delete(long userId)
        {
            var user = Read(userId);
            user.IsDeleted = true;
            _dbContext.Users.Update(user);
            _dbContext.SaveChanges();

            return true;
        }
    }
}
