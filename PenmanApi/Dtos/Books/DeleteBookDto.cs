using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class DeleteBookDto
    {
        [Required]
        public long BookId { get; set; }

        [Required]
        public long AuthorId { get; set; }

        public override string ToString()
        {
            return $"BookId: {BookId}, AuthorId: {AuthorId}";
        }
    }
}
