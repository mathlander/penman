using System;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class UpdateChapterResponseDto
    {
        public long ChapterId { get; set; }
        public long AuthorId { get; set; }
        public long BookId { get; set; }
        public long? TimelineId { get; set; }
        public int SortOrder { get; set; }
        public string Title { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"ChapterId: {ChapterId}, AuthorId: {AuthorId}, BookId: {BookId}, TimelineId: {TimelineId}, SortOrder: {SortOrder}, Title: {Title}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}