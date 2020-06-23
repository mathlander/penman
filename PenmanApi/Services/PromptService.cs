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
                // .Join() // join the collaborations and prompts tables to ensure that the authorizedUserId is authorized to read the tag
                .Where(p => p.PromptId == promptId && p.UserId == authorizedUserId)
                .FirstOrDefault();

            if (prompt == null)
                throw new NullReferenceException($"The specified promptId [{promptId}] does not exist.");

            return prompt;
        }

        public IEnumerable<Prompt> ReadAll(long authorizedUserId, long requestedUserId, DateTime lastReadAll)
        {
            return _dbContext.Prompts
                .Where(p => p.UserId == requestedUserId && p.ModifiedDate >= lastReadAll)
                .ToArray();
        }

        public Prompt UpdatePrompt(long authorizedUserId, long promptId, DateTime eventStart, DateTime eventEnd, string title, string body)
        {
            var prompt = Read(authorizedUserId, promptId);
            prompt.EventStart = eventStart;
            prompt.EventEnd = eventEnd;
            prompt.Title = title;
            prompt.Body = body;
            _dbContext.Prompts.Update(prompt);
            _dbContext.SaveChanges();

            return prompt;
        }

        public bool Delete(long authorizedUserId, long promptId)
        {
            var prompt = Read(authorizedUserId, promptId);
            prompt.IsDeleted = true;
            _dbContext.Prompts.Update(prompt);
            _dbContext.SaveChanges();
            return true;
        }
     }
}
