using System;
using System.Linq;

namespace PenmanApi.Dtos.Books
{
    [Serializable]
    public class ReadAllBooksResponseDto
    {
        public ReadBookResponseDto[] Books { get; set; }

        public override string ToString()
        {
            return $"Books: [{String.Join("\r\n\r\n/***/\r\n\r\n", Books.AsEnumerable())}]";
        }
    }
}
