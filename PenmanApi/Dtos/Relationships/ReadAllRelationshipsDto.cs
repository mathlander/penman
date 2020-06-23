using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Relationships
{
    [Serializable]
    public class ReadAllRelationshipsDto
    {
        [Required]
        public long UserId { get; set; }

        public DateTime? LastReadAll { get; set; }

        public override string ToString()
        {
            var readAll = LastReadAll.HasValue ? LastReadAll.Value.ToString() : "never";
            return $"UserId: {UserId}, LastReadAll: {readAll}";
        }
    }
}
