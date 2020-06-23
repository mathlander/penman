using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IPersonificationService
    {
        Personification Create(Personification personification);
        Personification Read(long authorizedUserId, long personificationId);
        IEnumerable<Personification> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll);
        Personification UpdatePersonification(long authorizedUserId, long personificationId, string firstName, string middleName, string lastName, DateTime birthday);
        bool Delete(long authorizedUserId, long personificationId);
    }
}
