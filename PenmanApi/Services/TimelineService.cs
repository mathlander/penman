using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class TimelineService : ITimelineService
    {
        private readonly PenmanContext _dbContext;

        public TimelineService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Timeline Create(Timeline timeline)
        {
            var timelineEntity = _dbContext.Timeline.Add(timeline).Entity;
            _dbContext.SaveChanges();

            return timelineEntity;
        }

        public Timeline Read(long timelineId, long authorId)
        {
            var timeline = _dbContext.Timeline
                .Where(t => t.TimelineId == timelineId)
                .FirstOrDefault();

            // for now, only the author themself is allowed to read the timeline
            // however, we want to decouple this check from the query in case
            // we choose to allow timelines to be shared in the future
            if (timeline == null)
                throw new NullReferenceException($"The specified timelineId [{timelineId}] does not exist.");
            else if (timeline.AuthorId != authorId)
                throw new UnauthorizedAccessException("Only the author is allowed to access this timeline.");

            return timeline;
        }

        public IEnumerable<Timeline> ReadAll(long authorId, DateTime lastReadAll)
        {
            return _dbContext.Timeline
                .Where(t => t.AuthorId == authorId && t.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Timeline UpdateTimeline(long timelineId, long authorId, string title, DateTime eventStart, DateTime eventEnd)
        {
            var timeline = Read(timelineId, authorId);
            timeline.Title = title;
            timeline.EventStart = eventStart;
            timeline.EventEnd = eventEnd;
            _dbContext.Timeline.Update(timeline);
            _dbContext.SaveChanges();

            return timeline;
        }

        public bool Delete(long timelineId, long authorId)
        {
            // may add an IsDeleted property down the line
            // for now, give the people what they want
            try
            {
                // a NullReferenceException is thrown if timelineId is undefined
                // and an UnauthorizedException is thrown if authorId is not the owner of the record
                var timeline = Read(timelineId, authorId);
                _dbContext.Timeline.Remove(timeline);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete timelineId [{timelineId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }
    }
}
