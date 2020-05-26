using System;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class CreateTimelineResponseDto
    {
        public long TimelineId { get; set; }
        public long AuthorId { get; set; }
        public Guid ClientId { get; set; }
        public string Title { get; set; }
        public DateTime EventStart { get; set; }
        public DateTime EventEnd { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"TimelineId: {TimelineId}, AuthorId: {AuthorId}, ClientId: {ClientId}, Title: {Title}, EventStart: {EventStart}, EventEnd: {EventEnd}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}
