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
            var testPersonification = _dbContext.Personifications
                .Where(p => p.ClientId == personification.ClientId)
                .FirstOrDefault();

            if (testPersonification != null)
                throw new CollisionException($"The specified clientId [{personification.ClientId}] already exists in the database.");

            var personificationEntity = _dbContext.Personifications.Add(personification).Entity;
            _dbContext.SaveChanges();

            return personificationEntity;
        }
 
        public Personification Read(long authorizedUserId, long personificationId)
        {
            var personification = _dbContext.Personifications
                // .Join() // join the collaborations and personifications tables to ensure that the authorizedUserId is authorized to read the tag
                .Where(p => p.PersonificationId == personificationId && p.UserId == authorizedUserId)
                .FirstOrDefault();

            if (personification == null)
                throw new NullReferenceException($"The specified personificationId [{personificationId}] does not exist.");

            return personification;
        }

        public IEnumerable<Personification> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll)
        {
            return _dbContext.Personifications
                .Where(p => p.UserId == requestedUserId && p.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Personification UpdatePersonification(long authorizedUserId, long personificationId, string firstName, string middleName, string lastName, DateTime birthday)
        {
            var personification = Read(authorizedUserId, personificationId);
            personification.FirstName = firstName;
            personification.MiddleName = middleName;
            personification.LastName = lastName;
            personification.Birthday = birthday;
            _dbContext.Personifications.Update(personification);
            _dbContext.SaveChanges();

            return personification;
        }

        public bool Delete(long authorizedUserId, long personificationId)
        {
            var personification = Read(authorizedUserId, personificationId);
            personification.IsDeleted = true;
            _dbContext.Personifications.Update(personification);
            _dbContext.SaveChanges();
            return true;
        }
     }
}
