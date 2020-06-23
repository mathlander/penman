using System;
using System.Linq;

namespace PenmanApi.Dtos.Tags
{
    [Serializable]
    public class TagCollectionResponseDto
    {
        public TagResponseDto[] Tags { get; set; }
        public DateTime LastReadAll { get; set; }

        public override string ToString()
        {
            return $"LastReadAll: {LastReadAll}, Tags: [{String.Join("\r\n\r\n/***/\r\n\r\n", Tags.AsEnumerable())}]";
        }
    }
}
