using System;
using System.Linq;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class ReadAllPromptsResponseDto
    {
        public ReadPromptResponseDto[] Prompts { get; set; }

        public override string ToString()
        {
            return $"Prompts: [{String.Join("\r\n\r\n/***/\r\n\r\n", Prompts.AsEnumerable())}]";
        }
    }
}
