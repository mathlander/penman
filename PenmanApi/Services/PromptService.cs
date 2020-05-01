using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;
using System.Security.Cryptography;
using System.Text;
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
            var promptEntity = _dbContext.Prompt.Add(prompt).Entity;
            _dbContext.SaveChanges();

            return promptEntity;
        }

        public Prompt Read(long promptId, long authorId)
        {
            var prompt = _dbContext.Prompt
                .Where(p => p.PromptId == promptId)
                .FirstOrDefault();

            // for now, only the author themself is allowed to read the prompt
            // however, we want to decouple this check from the query in case
            // we choose to allow prompts to be shared in the future
            if (prompt == null)
                throw new NullReferenceException($"The specified promptId [{promptId}] does not exist.");
            else if (prompt.AuthorId != authorId)
                throw new UnauthorizedAccessException("Only the author is allowed to access this prompt.");

            return prompt;
        }

        public IEnumerable<Prompt> ReadAll(long authorId)
        {
            return _dbContext.Prompt
                .Where(p => p.AuthorId == authorId)
                .ToArray();
        }

        public Prompt UpdatePrompt(long promptId, long authorId, string title, string body)
        {
            var prompt = Read(promptId, authorId);
            prompt.Title = title;
            prompt.Body = body;
            _dbContext.Prompt.Update(prompt);
            _dbContext.SaveChanges();

            return prompt;
        }

        public bool Delete(long promptId, long authorId)
        {
            // may add an IsDeleted property down the line
            // for now, give the people what they want
            try
            {
                // a NullReferenceException is thrown if promptId is undefined
                // and an UnauthorizedException is thrown if authorId is not the owner of the record
                var prompt = Read(promptId, authorId);
                _dbContext.Prompt.Remove(prompt);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to delete promptId [{promptId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }
    }
}
