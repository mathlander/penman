using System;

namespace PenmanApi.Dtos.Prompts
{
    [Serializable]
    public class CreatePromptResponseDto
    {
        public long PromptId { get; set; }
        public long AuthorId { get; set; }
        public Guid ClientId { get; set; }
        public string Body { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}, ClientId: {ClientId}, Title: {Title}, Body: {Body}";
        }
    }
}
