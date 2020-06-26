using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IPromptService
    {
        Prompt Create(Prompt prompt);
        Prompt Read(long authorizedUserId, long promptId);
        IEnumerable<Prompt> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAllDate);
        Prompt UpdatePrompt(long authorizedUserId, long promptId, DateTime eventStartDate, DateTime eventEndDate, string title, string body);
        bool Delete(long authorizedUserId, long promptId);
    }
}
