using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class BookService : IBookService
    {
        private readonly PenmanContext _dbContext;

        public BookService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Book Create(Book book)
        {
            var testBook = _dbContext.Books
                .Where(b => b.ClientId == book.ClientId)
                .FirstOrDefault();

            if (testBook != null)
                throw new CollisionException($"The specified clientId [{book.ClientId}] already exists in the database.");

            var bookEntity = _dbContext.Books.Add(book).Entity;
            _dbContext.SaveChanges();

            return bookEntity;
        }
 
        public Book Read(long authorizedUserId, long bookId)
        {
            var book = _dbContext.Books
                // .Join() // join the collaborations and books tables to ensure that the authorizedUserId is authorized to read the tag
                .Where(b => b.BookId == bookId && b.UserId == authorizedUserId)
                .FirstOrDefault();

            if (book == null)
                throw new NullReferenceException($"The specified bookId [{bookId}] does not exist.");

            return book;
        }

        public IEnumerable<Book> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll)
        {
            return _dbContext.Books
                .Where(b => b.UserId == requestedUserId && b.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Book UpdateBook(long authorizedUserId, long bookId, DateTime? eventStart, DateTime? eventEnd, string title)
        {
            var book = Read(authorizedUserId, bookId);
            book.EventStart = eventStart;
            book.EventStart = eventEnd;
            book.Title = title;
            _dbContext.Books.Update(book);
            _dbContext.SaveChanges();

            return book;
        }

        public bool Delete(long authorizedUserId, long bookId)
        {
            var book = Read(authorizedUserId, bookId);
            book.IsDeleted = true;
            _dbContext.Books.Update(book);
            _dbContext.SaveChanges();
            return true;
        }
     }
}
