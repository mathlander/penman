using System;

namespace PenmanApi
{
    internal static class Constants
    {
        /* SHA Hashing */
        // The salt for a SHA hash is the same length as the output value, i.e.
        // for SHA512 the salt should be 512 bits (64 bytes).
        public const int SaltLength = 64;
        public const int PasswordLength = 64;

        /* AES Encryption */
        public const int InitialVectorLength = 16;
        public const int AesKeyLength = 16;

        /* WebSocket Client-Side Subscribable Event Types */
        public const string BookCreatedEventType = "NOTIFICATION_BOOK_CREATED";
        public const string BookUpdatedEventType = "NOTIFICATION_BOOK_UPDATED";
        public const string BookDeletedEventType = "NOTIFICATION_BOOK_DELETED";
        public const string ChapterCreatedEventType = "NOTIFICATION_CHAPTER_CREATED";
        public const string ChapterUpdatedEventType = "NOTIFICATION_CHAPTER_UPDATED";
        public const string ChapterDeletedEventType = "NOTIFICATION_CHAPTER_DELETED";
        public const string PersonificationCreatedEventType = "NOTIFICATION_PERSONIFICATION_CREATED";
        public const string PersonificationUpdatedEventType = "NOTIFICATION_PERSONIFICATION_UPDATED";
        public const string PersonificationDeletedEventType = "NOTIFICATION_PERSONIFICATION_DELETED";
        public const string PromptCreatedEventType = "NOTIFICATION_PROMPT_CREATED";
        public const string PromptUpdatedEventType = "NOTIFICATION_PROMPT_UPDATED";
        public const string PromptDeletedEventType = "NOTIFICATION_PROMPT_DELETED";
        public const string RelationshipCreatedEventType = "NOTIFICATION_RELATIONSHIP_CREATED";
        public const string RelationshipUpdatedEventType = "NOTIFICATION_RELATIONSHIP_UPDATED";
        public const string RelationshipDeletedEventType = "NOTIFICATION_RELATIONSHIP_DELETED";
        public const string ShortCreatedEventType = "NOTIFICATION_SHORT_CREATED";
        public const string ShortUpdatedEventType = "NOTIFICATION_SHORT_UPDATED";
        public const string ShortDeletedEventType = "NOTIFICATION_SHORT_DELETED";
        public const string TagCreatedEventType = "NOTIFICATION_TAG_CREATED";
        public const string TagUpdatedEventType = "NOTIFICATION_TAG_UPDATED";
        public const string TagDeletedEventType = "NOTIFICATION_TAG_DELETED";
        // green notification for friends list
        public const string UserActivatedEventType = "NOTIFICATION_USER_ACTIVATED";
        // a message event
        public const string UserMessagedEventType = "NOTIFICATION_USER_MESSAGED";
        // invitation to connect
        public const string UserConnectionRequestEventType = "NOTIFICATION_USER_CONNECTION_REQUEST"; 
        // a user shared a book, chapter, character, prompt, or short with a connection
        public const string UserSharedEntityEventType = "NOTIFICATION_USER_SHARED_ENTITY";

        /* WebSocket Hub Routes */
        public const string PenmanHubRoute = "/hubs/penman";
        // public const string BooksHubRoute = "/hubs/books";
        // public const string ChaptersHubRoute = "/hubs/chapters";
        // public const string PersonificationsHubRoute = "/hubs/personifications";
        // public const string PromptsHubRoute = "/hubs/prompts";
        // public const string RelationshipsHubRoute = "/hubs/relationships";
        // public const string ShortsHubRoute = "/hubs/shorts";
        // public const string TagsHubRoute = "/hubs/tags";
        // public const string UsersHubRoute = "/hubs/users";
    }
}
