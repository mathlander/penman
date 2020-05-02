using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IShortService
    {
        Short Create(Short shortEntity);
        Short Read(long shortId, long authorId);
        IEnumerable<Short> ReadAll(long authorId);
        Short UpdateShort(long shortId, long authorId, string title, string body, DateTime eventStart, DateTime eventEnd);
        bool Delete(long shortId, long authorId);
    }
}
