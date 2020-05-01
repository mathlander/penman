using System;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class ReadPromptResponseDto
    {
        public long PromptId { get; set; }
        public long AuthorId { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"PromptId: {PromptId}, AuthorId: {AuthorId}, Title: {Title}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, Body: {Body}";
        }
    }
}
