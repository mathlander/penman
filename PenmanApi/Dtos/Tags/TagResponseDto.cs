using System;

namespace PenmanApi.Dtos.Tags
{
    [Serializable]
    public class TagResponseDto
    {
        public long TagId { get; set; }
        public long UserId { get; set; }
        public Guid ClientId { get; set; }
        public string TagName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsDeleted { get; set; }

        public override string ToString()
        {
            return $"TagId: {TagId}, UserId: {UserId}, ClientId: {ClientId}, TagName: {TagName}, CreatedDate: {CreatedDate}, ModifiedDate: {ModifiedDate}, IsDeleted: {IsDeleted}";
        }
    }
}
