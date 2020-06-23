using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IShortService
    {
        Short Create(Short shortEntity);
        Short Read(long authorizedUserId, long shortId);
        IEnumerable<Short> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll);
        Short UpdateShort(long authorizedUserId, long shortId, string title, string body, DateTime eventStart, DateTime eventEnd);
        bool Delete(long authorizedUserId, long shortId);
    }
}
