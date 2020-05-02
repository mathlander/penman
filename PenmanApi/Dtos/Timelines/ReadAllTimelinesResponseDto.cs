using System;
using System.Linq;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class ReadAllTimelinesResponseDto
    {
        public ReadTimelineResponseDto[] Timelines { get; set; }

        public override string ToString()
        {
            return $"Timelines: [{String.Join("\r\n\r\n/***/\r\n\r\n", Timelines.AsEnumerable())}]";
        }
    }
}
