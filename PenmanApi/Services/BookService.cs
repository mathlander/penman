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
            var bookEntity = _dbContext.Book.Add(book).Entity;
            _dbContext.SaveChanges();

            return bookEntity;
        }

        public Book Read(long bookId, long authorId)
        {
            var book = _dbContext.Book
                .Where(b => b.BookId == bookId)
                .FirstOrDefault();

            // for now, only the author themself is allowed to read the book
            // however, we want to decouple this check from the query in case
            // we choose to allow books to be shared in the future
            if (book == null)
                throw new NullReferenceException($"The specified bookId [{bookId}] does not exist.");
            else if (book.AuthorId != authorId)
                throw new UnauthorizedAccessException("Only the author is allowed to access this book.");

            return book;
        }

        public IEnumerable<Book> ReadAll(long authorId)
        {
            return _dbContext.Book
                .Where(b => b.AuthorId == authorId)
                .ToArray();
        }

        public Book UpdateBook(long bookId, long authorId, long? timelineId, string title)
        {
            var book = Read(bookId, authorId);
            book.Title = title;
            book.TimelineId = timelineId;
            _dbContext.Book.Update(book);
            _dbContext.SaveChanges();

            return book;
        }

        public bool Delete(long bookId, long authorId)
        {
            // may add an IsDeleted property down the line
            // for now, give the people what they want
            try
            {
                // a NullReferenceException is thrown if bookId is undefined
                // and an UnauthorizedException is thrown if authorId is not the owner of the record
                var book = Read(bookId, authorId);
                _dbContext.Book.Remove(book);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete bookId [{bookId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }
    }
}
