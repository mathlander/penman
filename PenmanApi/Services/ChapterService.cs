using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class ChapterService : IChapterService
    {
        private readonly PenmanContext _dbContext;

        public ChapterService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Chapter Create(Chapter chapter)
        {
            var testChapter = _dbContext.Chapters
                .Where(c => c.ClientId == chapter.ClientId)
                .FirstOrDefault();

            if (testChapter != null)
                throw new CollisionException($"The specified clientId [{chapter.ClientId}] already exists in the database.");

            var chapterEntity = _dbContext.Chapters.Add(chapter).Entity;
            _dbContext.SaveChanges();

            return chapterEntity;
        }
 
        public Chapter Read(long authorizedUserId, long chapterId)
        {
            var chapter = _dbContext.Chapters
                // .Join() // join the collaborations and chapters tables to ensure that the authorizedUserId is authorized to read the tag
                .Where(c => c.ChapterId == chapterId && c.UserId == authorizedUserId)
                .FirstOrDefault();

            if (chapter == null)
                throw new NullReferenceException($"The specified chapterId [{chapterId}] does not exist.");

            return chapter;
        }

        public IEnumerable<Chapter> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll)
        {
            return _dbContext.Chapters
                .Where(c => c.UserId == requestedUserId && c.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Chapter UpdateChapter(long authorizedUserId, long chapterId, long bookId, DateTime eventStart, DateTime eventEnd, int sortOrder, string title, string body)
        {
            var chapter = Read(authorizedUserId, chapterId);
            chapter.BookId = bookId;
            chapter.EventStart = eventStart;
            chapter.EventStart = eventEnd;
            chapter.SortOrder = sortOrder;
            chapter.Title = title;
            chapter.Body = body;
            _dbContext.Chapters.Update(chapter);
            _dbContext.SaveChanges();

            return chapter;
        }

        public bool Delete(long authorizedUserId, long chapterId)
        {
            var chapter = Read(authorizedUserId, chapterId);
            chapter.IsDeleted = true;
            _dbContext.Chapters.Update(chapter);
            _dbContext.SaveChanges();
            return true;
        }
     }
}
