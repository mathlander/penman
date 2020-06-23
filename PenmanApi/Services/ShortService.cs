using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class ShortService : IShortService
    {
        private readonly PenmanContext _dbContext;

        public ShortService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Short Create(Short shortEntity)
        {
            var testShort = _dbContext.Shorts
                .Where(s => s.ClientId == shortEntity.ClientId)
                .FirstOrDefault();

            if (testShort != null)
                throw new CollisionException($"The specified clientId [{shortEntity.ClientId}] already exists in the database.");

            shortEntity = _dbContext.Shorts.Add(shortEntity).Entity;
            _dbContext.SaveChanges();

            return shortEntity;
        }
 
        public Short Read(long authorizedUserId, long shortId)
        {
            var shortEntity = _dbContext.Shorts
                // .Join() // join the collaborations and relationships tables to ensure that the authorizedUserId is authorized to read the tag
                .Where(s => s.ShortId == shortId && s.UserId == authorizedUserId)
                .FirstOrDefault();

            if (shortEntity == null)
                throw new NullReferenceException($"The specified shortId [{shortId}] does not exist.");

            return shortEntity;
        }

        public IEnumerable<Short> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll)
        {
            return _dbContext.Shorts
                .Where(s => s.UserId == requestedUserId && s.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Short UpdateShort(long authorizedUserId, long shortId, string title, string body, DateTime eventStart, DateTime eventEnd)
        {
            var shortEntity = Read(authorizedUserId, shortId);
            shortEntity.Title = title;
            shortEntity.Body = body;
            shortEntity.EventStart = eventStart;
            shortEntity.EventEnd = eventEnd;
            _dbContext.Shorts.Update(shortEntity);
            _dbContext.SaveChanges();

            return shortEntity;
        }

        public bool Delete(long authorizedUserId, long shortId)
        {
            var shortEntity = Read(authorizedUserId, shortId);
            shortEntity.IsDeleted = true;
            _dbContext.Shorts.Update(shortEntity);
            _dbContext.SaveChanges();
            return true;
        }
     }
}
