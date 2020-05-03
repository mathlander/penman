using System;
using System.Linq;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class ReadAllChaptersResponseDto
    {
        public ReadChapterResponseDto[] Chapters { get; set; }

        public override string ToString()
        {
            return $"Chapters: [{String.Join("\r\n\r\n/***/\r\n\r\n", Chapters.AsEnumerable())}]";
        }
    }
}
