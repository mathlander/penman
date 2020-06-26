using System;

namespace PenmanApi.Config
{
    public interface IAuthConfig
    {
        string Audience { get; }
        string Issuer { get; }
        string Secret { get; }
    }
}
