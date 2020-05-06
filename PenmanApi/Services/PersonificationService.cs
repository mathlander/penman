using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class PersonificationService : IPersonificationService
    {
        private readonly PenmanContext _dbContext;

        public PersonificationService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Personification Create(Personification personification)
        {
            var personificationEntity = _dbContext.Personification.Add(personification).Entity;
            _dbContext.SaveChanges();

            return personification;
        }

        public Personification Read(long personificationId, long authorId)
        {
            var personification = _dbContext.Personification
                .Where(p => p.PersonificationId == personificationId)
                .FirstOrDefault();

            // for now, only the author themself is allowed to read the personification
            // however, we want to decouple this check from the query in case
            // we choose to allow personifications to be shared in the future
            if (personification == null)
                throw new NullReferenceException($"The specified personificationId [{personificationId}] does not exist.");
            else if (personification.AuthorId != authorId)
                throw new UnauthorizedAccessException("Only the author is allowed to access this personification.");

            return personification;
        }

        public IEnumerable<Personification> ReadAll(long authorId, DateTime lastReadAll)
        {
            return _dbContext.Personification
                .Where(p => p.AuthorId == authorId && p.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Personification UpdatePersonification(long personificationId, long authorId, string firstName, string middleName, string lastName, DateTime birthday)
        {
            var personification = Read(personificationId, authorId);
            personification.FirstName = firstName;
            personification.MiddleName = middleName;
            personification.LastName = lastName;
            personification.Birthday = birthday;
            _dbContext.Personification.Update(personification);
            _dbContext.SaveChanges();

            return personification;
        }

        public bool Delete(long personificationId, long authorId)
        {
            // may add an IsDeleted property down the line
            // for now, give the people what they want
            try
            {
                // a NullReferenceException is thrown if personificationId is undefined
                // and an UnauthorizedException is thrown if authorId is not the owner of the record
                var personification = Read(personificationId, authorId);
                _dbContext.Personification.Remove(personification);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete personificationId [{personificationId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }
    }
}
