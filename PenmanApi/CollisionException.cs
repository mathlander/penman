using System;

namespace PenmanApi
{
    public class CollisionException : Exception
    {
        public CollisionException() : base() {}
        public CollisionException(string message) : base(message) {}
    }
}
