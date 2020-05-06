using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class ShortService: IShortService
    {
        private readonly PenmanContext _dbContext;

        public ShortService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Short Create(Short shortEntity)
        {
            shortEntity = _dbContext.Short.Add(shortEntity).Entity;
            _dbContext.SaveChanges();

            return shortEntity;
        }

        public Short Read(long shortId, long authorId)
        {
            var shortEntity = _dbContext.Short
                .Where(p => p.ShortId == shortId)
                .FirstOrDefault();

            // for now, only the author themself is allowed to read the short
            // however, we want to decouple this check from the query in case
            // we choose to allow shorts to be shared in the future
            if (shortEntity == null)
                throw new NullReferenceException($"The specified shortId [{shortId}] does not exist.");
            else if (shortEntity.AuthorId != authorId)
                throw new UnauthorizedAccessException("Only the author is allowed to access this short.");

            return shortEntity;
        }

        public IEnumerable<Short> ReadAll(long authorId, DateTime lastReadAll)
        {
            return _dbContext.Short
                .Where(s => s.AuthorId == authorId && s.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Short UpdateShort(long shortId, long authorId, string title, string body, DateTime eventStart, DateTime eventEnd)
        {
            var shortEntity = Read(shortId, authorId);
            shortEntity.Title = title;
            shortEntity.Body = body;
            shortEntity.EventStart = eventStart;
            shortEntity.EventEnd = eventEnd;
            _dbContext.Short.Update(shortEntity);
            _dbContext.SaveChanges();

            return shortEntity;
        }

        public bool Delete(long shortId, long authorId)
        {
            // may add an IsDeleted property down the line
            // for now, give the people what they want
            try
            {
                // a NullReferenceException is thrown if shortId is undefined
                // and an UnauthorizedException is thrown if authorId is not the owner of the record
                var shortEntity = Read(shortId, authorId);
                _dbContext.Short.Remove(shortEntity);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete shortId [{shortId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }
    }
}
