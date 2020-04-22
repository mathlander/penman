using System;

namespace PenmanApi.Config
{
    public class AuthConfig : IAuthConfig
    {
        public string Audience { get; set; }
        public string Issuer { get; set; }
        public string Secret { get; set; }
    }
}
