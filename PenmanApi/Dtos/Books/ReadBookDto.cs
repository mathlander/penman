using System;
using System.ComponentModel.DataAnnotations;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class ReadBookDto
    {
        [Required]
        public long BookId { get; set; }

        public override string ToString()
        {
            return $"BookId: {BookId}";
        }
    }
}
