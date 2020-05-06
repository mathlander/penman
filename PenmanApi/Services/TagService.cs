using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class TagService : ITagService
    {
        private readonly PenmanContext _dbContext;

        public TagService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Tag Create(Tag tag)
        {
            var tagEntity = _dbContext.Tag.Add(tag).Entity;
            _dbContext.SaveChanges();

            return tagEntity;
        }

        public Tag Read(long tagId, long authorId)
        {
            var tag = _dbContext.Tag
                .Where(t => t.TagId == tagId)
                .FirstOrDefault();

            // for now, only the author themself is allowed to read the tag
            // however, we want to decouple this check from the query in case
            // we choose to allow tags to be shared in the future
            if (tag == null)
                throw new NullReferenceException($"The specified tagId [{tagId}] does not exist.");
            else if (tag.AuthorId != authorId)
                throw new UnauthorizedAccessException("Only the author is allowed to access this tag.");

            return tag;
        }

        public IEnumerable<Tag> ReadAll(long authorId, DateTime lastReadAll)
        {
            return _dbContext.Tag
                .Where(t => t.AuthorId == authorId && t.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Tag UpdateTag(long tagId, long authorId, string tagName)
        {
            var tag = Read(tagId, authorId);
            tag.TagName = tagName;
            _dbContext.Tag.Update(tag);
            _dbContext.SaveChanges();

            return tag;
        }

        public bool Delete(long tagId, long authorId)
        {
            // may add an IsDeleted property down the line
            // for now, give the people what they want
            try
            {
                // a NullReferenceException is thrown if tagId is undefined
                // and an UnauthorizedException is thrown if authorId is not the owner of the record
                var tag = Read(tagId, authorId);
                _dbContext.Tag.Remove(tag);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete tagId [{tagId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }
    }
}
