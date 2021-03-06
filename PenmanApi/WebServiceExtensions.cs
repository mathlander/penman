using Microsoft.AspNetCore.Http;
using System;
using System.Security.Claims;

namespace PenmanApi
{
    public static class WebServiceExtensions
    {
        public static bool IsUserTokenExpired(this IHttpContextAccessor httpContextAccessor)
        {
            var expirationDate = Convert.ToDateTime(httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.Expiration).Value);

            return DateTime.Now.CompareTo(expirationDate) > 0;
        }

        public static long GetCurrentUserId(this IHttpContextAccessor httpContextAccessor)
        {
            return Convert.ToInt64(httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier).Value);
        }
    }
}
