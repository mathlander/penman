using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface ITimelineService
    {
        Timeline Create(Timeline timeline);
        Timeline Read(long timelineId, long authorId);
        IEnumerable<Timeline> ReadAll(long authorId);
        Timeline UpdateTimeline(long timelineId, long authorId, string title, DateTime eventStart, DateTime eventEnd);
        bool Delete(long timelineId, long authorId);
    }
}
