using System;
using System.Linq;

namespace PenmanApi.Dtos.Relationships
{
    [Serializable]
    public class RelationshipCollectionResponseDto
    {
        public RelationshipResponseDto[] Relationships { get; set; }
        public DateTime LastReadAll { get; set; }

        public override string ToString()
        {
            return $"LastReadAll: {LastReadAll}, Relationships: [{String.Join("\r\n\r\n/***/\r\n\r\n", Relationships.AsEnumerable())}]";
        }
    }
}
