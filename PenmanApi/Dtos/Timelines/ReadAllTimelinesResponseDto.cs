using System;
using System.Linq;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class ReadAllTimelinesResponseDto
    {
        public ReadTimelineResponseDto[] Timelines { get; set; }
        public DateTime LastReadAll { get; set; }

        public override string ToString()
        {
            return $"LastReadAll: {LastReadAll}, Timelines: [{String.Join("\r\n\r\n/***/\r\n\r\n", Timelines.AsEnumerable())}]";
        }
    }
}
