using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IPromptService
    {
        Prompt Create(Prompt prompt);
        Prompt Read(long promptId, long authorId);
        IEnumerable<Prompt> ReadAll(long authorId, DateTime lastReadAll);
        Prompt UpdatePrompt(long promptId, long authorId, string title, string body);
        bool Delete(long promptId, long authorId);
    }
}
