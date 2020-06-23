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
            var testTag = _dbContext.Tags
                .Where(t => t.ClientId == tag.ClientId)
                .FirstOrDefault();

            if (testTag != null)
                throw new CollisionException($"The specified clientId [{tag.ClientId}] already exists in the database.");

            var tagEntity = _dbContext.Tags.Add(tag).Entity;
            _dbContext.SaveChanges();

            return tagEntity;
        }
 
        public Tag Read(long authorizedUserId, long tagId)
        {
            var tag = _dbContext.Tags
                // .Join() // join the collaborations and relationships tables to ensure that the authorizedUserId is authorized to read the tag
                .Where(t => t.TagId == tagId && t.UserId == authorizedUserId)
                .FirstOrDefault();

            if (tag == null)
                throw new NullReferenceException($"The specified tagId [{tagId}] does not exist.");

            return tag;
        }

        public IEnumerable<Tag> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll)
        {
            return _dbContext.Tags
                .Where(t => t.UserId == requestedUserId && t.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Tag UpdateTag(long authorizedUserId, long tagId, string tagName)
        {
            var tag = Read(authorizedUserId, tagId);
            tag.TagName = tagName;
            _dbContext.Tags.Update(tag);
            _dbContext.SaveChanges();

            return tag;
        }

        public bool Delete(long authorizedUserId, long tagId)
        {
            var tag = Read(authorizedUserId, tagId);
            tag.IsDeleted = true;
            _dbContext.Tags.Update(tag);
            _dbContext.SaveChanges();
            return true;
        }
     }
}
