using System;
using System.Linq;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class PersonificationCollectionResponseDto
    {
        public PersonificationResponseDto[] Personifications { get; set; }
        public DateTime LastReadAll { get; set; }

        public override string ToString()
        {
            return $"LastReadAll: {LastReadAll}, Personifications: [{String.Join("\r\n\r\n/***/\r\n\r\n", Personifications.AsEnumerable())}]";
        }
    }
}
