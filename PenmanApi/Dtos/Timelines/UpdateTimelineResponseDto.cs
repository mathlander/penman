using System;

namespace PenmanApi.Dtos.Timelines
{
    [Serializable]
    public class UpdateTimelineResponseDto
    {
        public long TimelineId { get; set; }
        public long AuthorId { get; set; }
        public string Title { get; set; }
        public DateTime EventStart { get; set; }
        public DateTime EventEnd { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }

        public override string ToString()
        {
            return $"TimelineId: {TimelineId}, AuthorId: {AuthorId}, Title: {Title}, EventStart: {EventStart}, EventEnd: {EventEnd}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}";
        }
    }
}
