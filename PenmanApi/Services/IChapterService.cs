using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IChapterService
    {
        Chapter Create(Chapter chapter);
        Chapter Read(long chapterId, long authorId);
        IEnumerable<Chapter> ReadAll(long authorId);
        Chapter UpdateChapter(long chapterId, long authorId, long bookId, long timelineId, string title);
        bool Delete(long chapterId, long authorId);
    }
}
