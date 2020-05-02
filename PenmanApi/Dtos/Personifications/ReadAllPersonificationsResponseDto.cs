using System;
using System.Linq;

namespace PenmanApi.Dtos.Personifications
{
    [Serializable]
    public class ReadAllPersonificationsResponseDto
    {
        public ReadPersonificationResponseDto[] Personifications { get; set; }

        public override string ToString()
        {
            return $"Personifications: [{String.Join("\r\n\r\n/***/\r\n\r\n", Personifications.AsEnumerable())}]";
        }
    }
}
