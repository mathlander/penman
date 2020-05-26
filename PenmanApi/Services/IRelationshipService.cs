using System;
using System.Collections.Generic;
using PenmanApi.Models;

namespace PenmanApi.Services
{
    public interface IRelationshipService
    {
        void RelatePromptTag(long promptId, long tagId, long authorId, Guid promptClientId, Guid tagClientId);
        void RelatePromptPersonification(long promptId, long personificationId, long authorId, Guid promptClientId, Guid personificationClientId);
        void RelatePersonificationTag(long personificationId, long tagId, long authorId, Guid personificationClientId, Guid tagClientId);
        void RelateShortPersonification(long shortId, long personificationId, long authorId, Guid shortClientId, Guid personificationClientId);
        void RelateShortTag(long shortId, long tagId, long authorId, Guid shortClientId, Guid tagClientId);
        void RelateShortPrompt(long shortId, long promptId, long authorId, Guid shortClientId, Guid promptClientId);

        bool UnrelatePromptTag(long promptId, long tagId, long authorId);
        bool UnrelatePromptPersonification(long promptId, long personificationId, long authorId);
        bool UnrelatePersonificationTag(long personificationId, long tagId, long authorId);
        bool UnrelateShortPersonification(long shortId, long personificationId, long authorId);
        bool UnrelateShortTag(long shortId, long tagId, long authorId);
        bool UnrelateShortPrompt(long shortId, long promptId, long authorId);
    }
}
