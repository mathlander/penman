using System;
using System.Collections.Generic;
using System.Linq;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class PromptService : IPromptService
    {
        private readonly PenmanContext _dbContext;

        public PromptService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public Prompt Create(Prompt prompt)
        {
            var testPrompt = _dbContext.Prompts
                .Where(p => p.ClientId == prompt.ClientId)
                .FirstOrDefault();
            if (testPrompt != null)
                throw new CollisionException($"The specified clientId [{prompt.ClientId}] already exists in the database.");

            var promptEntity = _dbContext.Prompts.Add(prompt).Entity;
            _dbContext.SaveChanges();
            return promptEntity;
        }

        public Prompt Read(long authorizedUserId, long promptId)
        {
            var prompt = _dbContext.Prompts
                .Where(p => p.PromptId == promptId && p.UserId == authorizedUserId)
                .FirstOrDefault();
            if (prompt == null)
                throw new NullReferenceException($"The specified promptId [{promptId}] does not exist.");
            return prompt;
        }

        public IEnumerable<Prompt> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAllDate)
        {
            return _dbContext.Prompts
                .Where(p => p.UserId == requestedUserId && p.ModifiedDate >= lastReadAllDate)
                .ToArray();
        }

        public Prompt UpdatePrompt(long authorizedUserId, long promptId, DateTime eventStartDate, DateTime eventEndDate, string title, string body)
        {
            var prompt = Read(authorizedUserId, promptId);
            prompt.EventStartDate = eventStartDate;
            prompt.EventEndDate = eventEndDate;
            prompt.Title = title;
            prompt.Body = body;
            _dbContext.Prompts.Update(prompt);
            _dbContext.SaveChanges();
            return prompt;
        }

        public bool Delete(long authorizedUserId, long promptId)
        {
            var prompt = Read(authorizedUserId, promptId);
            if (prompt == null || (prompt.IsDeleted.HasValue && prompt.IsDeleted.Value))
                return false;
            prompt.IsDeleted = true;
            _dbContext.Prompts.Update(prompt);
            _dbContext.SaveChanges();
            return true;
        }
    }
}
