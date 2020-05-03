using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class ReadAllBooksDto
    {
        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"AuthorId: {AuthorId}";
        }
    }
}
