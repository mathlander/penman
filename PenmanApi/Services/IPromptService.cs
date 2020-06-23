using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IPromptService
    {
        Prompt Create(Prompt prompt);
        Prompt Read(long authorizedUserId, long promptId);
        IEnumerable<Prompt> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll);
        Prompt UpdatePrompt(long authorizedUserId, long promptId, DateTime eventStart, DateTime eventEnd, string title, string body);
        bool Delete(long authorizedUserId, long promptId);
    }
}
