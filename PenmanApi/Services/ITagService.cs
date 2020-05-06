using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface ITagService
    {
        Tag Create(Tag tag);
        Tag Read(long tagId, long authorId);
        IEnumerable<Tag> ReadAll(long authorId, DateTime lastReadAll);
        Tag UpdateTag(long tagId, long authorId, string tagName);
        bool Delete(long tagId, long authorId);
    }
}
