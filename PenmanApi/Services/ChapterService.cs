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
            var chapterEntity = _dbContext.Chapter.Add(chapter).Entity;
            _dbContext.SaveChanges();

            return chapterEntity;
        }

        public Chapter Read(long chapterId, long authorId)
        {
            var chapter = _dbContext.Chapter
                .Where(c => c.ChapterId == chapterId)
                .FirstOrDefault();

            // for now, only the author themself is allowed to read the chapter
            // however, we want to decouple this check from the query in case
            // we choose to allow chapters to be shared in the future
            if (chapter == null)
                throw new NullReferenceException($"The specified chapterId [{chapterId}] does not exist.");
            else if (chapter.AuthorId != authorId)
                throw new UnauthorizedAccessException("Only the author is allowed to access this chapter.");

            return chapter;
        }

        public IEnumerable<Chapter> ReadAll(long authorId)
        {
            return _dbContext.Chapter
                .Where(c => c.AuthorId == authorId)
                .ToArray();
        }

        public Chapter UpdateChapter(long chapterId, long authorId, long bookId, long timelineId, string title)
        {
            var chapter = Read(chapterId, authorId);
            chapter.Title = title;
            chapter.TimelineId = timelineId <= 0 ? (long?) null : timelineId;
            _dbContext.Chapter.Update(chapter);
            _dbContext.SaveChanges();

            return chapter;
        }

        public bool Delete(long chapterId, long authorId)
        {
            // may add an IsDeleted property down the line
            // for now, give the people what they want
            try
            {
                // a NullReferenceException is thrown if chapterId is undefined
                // and an UnauthorizedException is thrown if authorId is not the owner of the record
                var chapter = Read(chapterId, authorId);
                _dbContext.Chapter.Remove(chapter);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete chapterId [{chapterId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }
    }
}
