using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IRelationshipService
    {
        Relationship Create(Relationship relationship);
        Relationship Read(long authorizedUserId, long relationshipId);
        IEnumerable<Relationship> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll);
        Relationship UpdateRelationship(long authorizedUserId, long relationshipId, Guid objectClientId, Guid chipClientId);
        bool Delete(long authorizedUserId, long relationshipId);
    }
}
