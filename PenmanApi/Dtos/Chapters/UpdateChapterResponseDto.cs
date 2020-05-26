using System;
using PenmanApi.Dtos.Timelines;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class UpdateChapterResponseDto
    {
        public long ChapterId { get; set; }
        public long AuthorId { get; set; }
        public Guid ClientId { get; set; }
        public long BookId { get; set; }
        public long? TimelineId { get; set; }
        public int SortOrder { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public ReadTimelineResponseDto Timeline { get; set; }

        public override string ToString()
        {
            return $"ChapterId: {ChapterId}, AuthorId: {AuthorId}, ClientId: {ClientId}, BookId: {BookId}, TimelineId: {TimelineId}, SortOrder: {SortOrder}, Title: {Title}, Body: [{Body.Length} characters], CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}
