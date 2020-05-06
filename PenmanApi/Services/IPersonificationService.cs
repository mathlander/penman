using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IPersonificationService
    {
        Personification Create(Personification personification);
        Personification Read(long personificationId, long authorId);
        IEnumerable<Personification> ReadAll(long authorId, DateTime lastReadAll);
        Personification UpdatePersonification(long personificationId, long authorId, string firstName, string middleName, string lastName, DateTime birthday);
        bool Delete(long personificationId, long authorId);
    }
}
