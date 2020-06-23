using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface ITagService
    {
        Tag Create(Tag tag);
        Tag Read(long authorizedUserId, long tagId);
        IEnumerable<Tag> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll);
        Tag UpdateTag(long authorizedUserId, long tagId, string tagName);
        bool Delete(long authorizedUserId, long tagId);
    }
}
