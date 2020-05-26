using System;
using System.Collections.Generic;
using PenmanApi.Dtos.Chapters;
using PenmanApi.Dtos.Timelines;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class ReadBookResponseDto
    {
        public long BookId { get; set; }
        public long AuthorId { get; set; }
        public Guid ClientId { get; set; }
        public long? TimelineId { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public List<ReadChapterResponseDto> Chapters { get; set; }
        public ReadTimelineResponseDto Timeline { get; set; }

        public override string ToString()
        {
            return $"BookId: {BookId}, AuthorId: {AuthorId}, ClientId: {ClientId}, TimelineId: {TimelineId}, Title: {Title}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}
