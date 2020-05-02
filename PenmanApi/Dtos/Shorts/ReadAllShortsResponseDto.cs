using System;
using System.Linq;

namespace PenmanApi.Dtos.Shorts
{
    [Serializable]
    public class ReadAllShortsResponseDto
    {
        public ReadShortResponseDto[] Shorts { get; set; }

        public override string ToString()
        {
            return $"Shorts: [{String.Join("\r\n\r\n/***/\r\n\r\n", Shorts.AsEnumerable())}]";
        }
    }
}
