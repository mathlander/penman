using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IBookService
    {
        Book Create(Book book);
        Book Read(long authorizedUserId, long bookId);
        IEnumerable<Book> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll);
        Book UpdateBook(long authorizedUserId, long bookId, DateTime? eventStart, DateTime? eventEnd, string title);
        bool Delete(long authorizedUserId, long bookId);
    }
}
