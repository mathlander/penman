using System;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IAuthorService
    {
        Author Authenticate(string username, string password);
        Author Create(string username, string email, string password, string firstName, string middleName, string lastName);
        Author Read(long authorId);
        Author Read(string username);
        Author UpdateProfile(long authorId, string username, string email, string firstName, string middleName, string lastName);
        Author UpdatePassword(long authorId, string password);
        bool Delete(long authorId);
        string EncodeRefreshToken(string username, DateTime expiryDate);
        bool ValidateRefreshToken(string encodedRefreshToken, out DecodedRefreshTokenClaims refreshTokenClaims, out Author user);
    }
}
