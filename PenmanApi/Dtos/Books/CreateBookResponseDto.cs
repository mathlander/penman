using System;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class CreateBookResponseDto
    {
        public long BookId { get; set; }
        public long AuthorId { get; set; }
        public Guid ClientId { get; set; }
        public long? TimelineId { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"BookId: {BookId}, AuthorId: {AuthorId}, ClientId: {ClientId}, TimelineId: {TimelineId}, Title: {Title}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}
