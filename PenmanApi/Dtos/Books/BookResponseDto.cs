using System;
using System.Collections.Generic;
using PenmanApi.Dtos.Chapters;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class BookResponseDto
    {
        public long BookId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public string Title { get; set; }
        public DateTime? EventStart { get; set; }
        public DateTime? EventEnd { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsDeleted { get; set; }

        public List<ChapterResponseDto> Chapters { get; set; }

        public override string ToString()
        {
            var eventStart = EventStart.HasValue ? EventStart.Value.ToString() : String.Empty;
            var eventEnd = EventEnd.HasValue ? EventEnd.Value.ToString() : String.Empty;
            return $"BookId: {BookId}, UserId: {UserId}, ClientId: {ClientId}, Title: {Title}, EventStart: {eventStart}, EventEnd: {eventEnd}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, IsDeleted: {IsDeleted}";
        }
    }
}
