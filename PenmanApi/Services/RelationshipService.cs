using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class RelationshipService : IRelationshipService
    {
        private readonly PenmanContext _dbContext;

        public RelationshipService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Relationship Create(Relationship relationship)
        {
            var testRelationship = _dbContext.Relationships
                .Where(r => r.ClientId == relationship.ClientId)
                .FirstOrDefault();

            if (testRelationship != null)
                throw new CollisionException($"The specified clientId [{relationship.ClientId}] already exists in the database.");

            var relationshipEntity = _dbContext.Relationships.Add(relationship).Entity;
            _dbContext.SaveChanges();

            return relationshipEntity;
        }
 
        public Relationship Read(long authorizedUserId, long relationshipId)
        {
            var relationship = _dbContext.Relationships
                // .Join() // join the collaborations and relationships tables to ensure that the authorizedUserId is authorized to read the tag
                .Where(r => r.RelationshipId == relationshipId && r.UserId == authorizedUserId)
                .FirstOrDefault();

            if (relationship == null)
                throw new NullReferenceException($"The specified relationshipId [{relationshipId}] does not exist.");

            return relationship;
        }

        public IEnumerable<Relationship> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll)
        {
            return _dbContext.Relationships
                .Where(r => r.UserId == requestedUserId && r.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Relationship UpdateRelationship(long authorizedUserId, long relationshipId, Guid objectClientId, Guid chipClientId)
        {
            var relationship = Read(authorizedUserId, relationshipId);
            relationship.ObjectClientId = objectClientId;
            relationship.ChipClientId = chipClientId;
            _dbContext.Relationships.Update(relationship);
            _dbContext.SaveChanges();

            return relationship;
        }

        public bool Delete(long authorizedUserId, long relationshipId)
        {
            var relationship = Read(authorizedUserId, relationshipId);
            relationship.IsDeleted = true;
            _dbContext.Relationships.Update(relationship);
            _dbContext.SaveChanges();
            return true;
        }
     }
}
