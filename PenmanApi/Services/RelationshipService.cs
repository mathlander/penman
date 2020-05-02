using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Linq;
using Npgsql;
using Npgsql.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using Npgsql.EntityFrameworkCore.PostgreSQL.Extensions;
using Npgsql.EntityFrameworkCore.PostgreSQL.Query;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public class RelationshipService : IRelationshipService
    {
        private readonly PenmanContext _dbContext;

        public RelationshipService(PenmanContext dbContext)
        {
            _dbContext = dbContext;
        }

        public void RelatePromptTag(long promptId, long tagId, long authorId)
        {
            // with no return value, allow any potential exceptions to bubble up
            var promptTagJoin = new PromptTagJoin
            {
                PromptId = promptId,
                TagId = tagId,
                AuthorId = authorId,
            };
            _dbContext.PromptTagJoin.Add(promptTagJoin);
            _dbContext.SaveChanges();
        }

        public void RelatePromptPersonification(long promptId, long personificationId, long authorId)
        {
            // with no return value, allow any potential exceptions to bubble up
            var promptPersonificationJoin = new PromptPersonificationJoin
            {
                PromptId = promptId,
                PersonificationId = personificationId,
                AuthorId = authorId,
            };
            _dbContext.PromptPersonificationJoin.Add(promptPersonificationJoin);
            _dbContext.SaveChanges();
        }

        public void RelatePersonificationTag(long personificationId, long tagId, long authorId)
        {
            // with no return value, allow any potential exceptions to bubble up
            var personificationTagJoin = new PersonificationTagJoin
            {
                PersonificationId = personificationId,
                TagId = tagId,
                AuthorId = authorId,
            };
            _dbContext.PersonificationTagJoin.Add(personificationTagJoin);
            _dbContext.SaveChanges();
        }

        public void RelateShortPersonification(long shortId, long personificationId, long authorId)
        {
            // with no return value, allow any potential exceptions to bubble up
            var shortPersonificationJoin = new ShortPersonificationJoin
            {
                ShortId = shortId,
                PersonificationId = personificationId,
                AuthorId = authorId,
            };
            _dbContext.ShortPersonificationJoin.Add(shortPersonificationJoin);
            _dbContext.SaveChanges();
        }

        public void RelateShortTag(long shortId, long tagId, long authorId)
        {
            // with no return value, allow any potential exceptions to bubble up
            var shortTagJoin = new ShortTagJoin
            {
                ShortId = shortId,
                TagId = tagId,
                AuthorId = authorId,
            };
            _dbContext.ShortTagJoin.Add(shortTagJoin);
            _dbContext.SaveChanges();
        }

        public void RelateShortPrompt(long shortId, long promptId, long authorId)
        {
            // with no return value, allow any potential exceptions to bubble up
            var shortPromptJoin = new ShortPromptJoin
            {
                ShortId = shortId,
                PromptId = promptId,
                AuthorId = authorId,
            };
            _dbContext.ShortPromptJoin.Add(shortPromptJoin);
            _dbContext.SaveChanges();
        }

        public bool UnrelatePromptTag(long promptId, long tagId, long authorId)
        {
            try
            {
                var promptTagJoin = new PromptTagJoin
                {
                    PromptId = promptId,
                    TagId = tagId,
                    AuthorId = authorId,
                };
                _dbContext.PromptTagJoin.Remove(promptTagJoin);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to remove relationship between promptId [{promptId}] and tagId [{tagId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }

        public bool UnrelatePromptPersonification(long promptId, long personificationId, long authorId)
        {
            try
            {
                var promptPersonificationJoin = new PromptPersonificationJoin
                {
                    PromptId = promptId,
                    PersonificationId = personificationId,
                    AuthorId = authorId,
                };
                _dbContext.PromptPersonificationJoin.Remove(promptPersonificationJoin);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to remove relationship between promptId [{promptId}] and personificationId [{personificationId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }

        public bool UnrelatePersonificationTag(long personificationId, long tagId, long authorId)
        {
            try
            {
                var personificationTagJoin = new PersonificationTagJoin
                {
                    PersonificationId = personificationId,
                    TagId = tagId,
                    AuthorId = authorId,
                };
                _dbContext.PersonificationTagJoin.Remove(personificationTagJoin);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to remove relationship between personificationId [{personificationId}] and tagId [{tagId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }

        public bool UnrelateShortPersonification(long shortId, long personificationId, long authorId)
        {
            try
            {
                var shortPersonificationJoin = new ShortPersonificationJoin
                {
                    ShortId = shortId,
                    PersonificationId = personificationId,
                    AuthorId = authorId,
                };
                _dbContext.ShortPersonificationJoin.Remove(shortPersonificationJoin);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to remove relationship between shortId [{shortId}] and personificationId [{personificationId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }

        public bool UnrelateShortTag(long shortId, long tagId, long authorId)
        {
            try
            {
                var shortTagJoin = new ShortTagJoin
                {
                    ShortId = shortId,
                    TagId = tagId,
                    AuthorId = authorId,
                };
                _dbContext.ShortTagJoin.Remove(shortTagJoin);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to remove relationship between shortId [{shortId}] and tagId [{tagId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }

        public bool UnrelateShortPrompt(long shortId, long promptId, long authorId)
        {
            try
            {
                var shortPromptJoin = new ShortPromptJoin
                {
                    ShortId = shortId,
                    PromptId = promptId,
                    AuthorId = authorId,
                };
                _dbContext.ShortPromptJoin.Remove(shortPromptJoin);
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encountered exception while attempting to remove relationship between shortId [{shortId}] and promptId [{promptId}]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return false;
            }

            return true;
        }
    }
}
