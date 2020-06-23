using System;

namespace PenmanApi.Dtos.Shorts
{
    [Serializable]
    public class ShortResponseDto
    {
        public long ShortId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public DateTime EventStart { get; set; }
        public DateTime EventEnd { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsDeleted { get; set; }

        public override string ToString()
        {
            return $"ShortId: {ShortId}, UserId: {UserId}, ClientId: {ClientId}, EventStart: {EventStart}, EventEnd: {EventEnd}, Title: {Title}, Body: {Body}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, IsDeleted: {IsDeleted}";
        }
    }
}
