using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IChapterService
    {
        Chapter Create(Chapter chapter);
        Chapter Read(long authorizedUserId, long chapterId);
        IEnumerable<Chapter> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll);
        Chapter UpdateChapter(long authorizedUserId, long chapterId, long bookId, DateTime eventStart, DateTime eventEnd, int sortOrder, string title, string body);
        bool Delete(long authorizedUserId, long personificationId);
    }
}
