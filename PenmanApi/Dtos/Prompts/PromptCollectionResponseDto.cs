using System;
using System.Linq;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class PromptCollectionResponseDto
    {
        public PromptResponseDto[] Prompts { get; set; }
        public DateTime LastReadAllDate { get; set; }

        public override string ToString()
        {
            return $"LastReadAllDate: {LastReadAllDate}, Prompts: [{String.Join("\r\n\r\n/***/\r\n\r\n", Prompts.AsEnumerable())}]";
        }
    }
}
