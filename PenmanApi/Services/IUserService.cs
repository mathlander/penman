using System;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IUserService
    {
        User Authenticate(string username, string password);
        User Create(User newUser, string password);
        User Read(long userId);
        User Read(string username);
        User UpdateProfile(long userId, string username, string email, string firstName, string middleName, string lastName);
        User UpdatePassword(long userId, string password);
        bool Delete(long userId);
        string EncodeRefreshToken(string username, DateTime expiryDate, bool invalidateExistingTokens);
        bool ValidateRefreshToken(string encodedRefreshToken, out DecodedRefreshTokenClaims refreshTokenClaims, out User user);
    }
}
