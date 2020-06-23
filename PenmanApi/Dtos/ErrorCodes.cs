using System;

namespace PenmanApi.Dtos
{
    public enum ErrorCodes
    {
        Unknown = 1000,
        ClientIdCollided = 1001,
        UnauthorizedAction = 1002,
        AuthenticationFailed = 1003,
        AccountDeleted = 1004,
        AccountLocked = 1005,
        RefreshTokenExpired = 1006,
        InvalidRefreshToken = 1007,
    }
}
