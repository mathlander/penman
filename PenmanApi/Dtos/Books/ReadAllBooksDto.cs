using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class ReadAllBooksDto
    {
        [Required]
        public long AuthorId { get; set; }

        public DateTime? LastReadAll { get; set; }

        public override string ToString()
        {
            var readAll = LastReadAll.HasValue
                ? LastReadAll.Value.ToString()
                : "never";
            return $"AuthorId: {AuthorId}, LastReadAll: {readAll}";
        }
    }
}
