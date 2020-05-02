using System;

namespace PenmanApi.Dtos.Shorts
{
    [Serializable]
    public class UpdateShortResponseDto
    {
        public long ShortId { get; set; }
        public long AuthorId { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public DateTime EventStart { get; set; }
        public DateTime EventEnd { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"ShortId: {ShortId}, AuthorId: {AuthorId}, Title: {Title}, EventStart: {EventStart}, EventEnd: {EventEnd}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, Body: {Body}";
        }
    }
}
