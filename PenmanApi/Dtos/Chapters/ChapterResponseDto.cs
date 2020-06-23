using System;

namespace PenmanApi.Dtos.Chapters
{
    [Serializable]
    public class ChapterResponseDto
    {
        public long ChapterId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public long BookId { get; set; }
        public DateTime EventStart { get; set; }
        public DateTime EventEnd { get; set; }
        public int SortOrder { get ;set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public DateTime CreatedDate { get ;set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsDeleted { get; set; }

        public override string ToString()
        {
            return $"ChapterId: {ChapterId}, UserId: {UserId}, ClientId: {ClientId}, BookId: {BookId}, EventStart: {EventStart}, EventEnd: {EventEnd}, SortOrder: {SortOrder}, Title: {Title}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, IsDeleted: {IsDeleted}";
        }
    }
}
