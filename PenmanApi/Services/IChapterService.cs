using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IChapterService
    {
        Chapter Create(Chapter chapter);
        Chapter Read(long chapterId, long authorId);
        IEnumerable<Chapter> ReadAll(long authorId, long bookId, DateTime lastReadAll);
        Chapter UpdateChapter(long chapterId, long authorId, long bookId, long? timelineId, int sortOrder, string title, string body);
        bool Delete(long chapterId, long authorId);
    }
}
