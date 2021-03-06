using System;
using System.Linq;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class ReadAllPromptsResponseDto
    {
        public ReadPromptResponseDto[] Prompts { get; set; }
        public DateTime LastReadAll { get; set; }

        public override string ToString()
        {
            return $"LastReadAll: {LastReadAll}, Prompts: [{String.Join("\r\n\r\n/***/\r\n\r\n", Prompts.AsEnumerable())}]";
        }
    }
}
