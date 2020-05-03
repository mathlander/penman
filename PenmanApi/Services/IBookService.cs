using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IBookService
    {
        Book Create(Book book);
        Book Read(long bookId, long authorId);
        IEnumerable<Book> ReadAll(long authorId);
        Book UpdateBook(long bookId, long authorId, long? timelineId, string title);
        bool Delete(long bookId, long authorId);
    }
}
