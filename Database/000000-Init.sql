/**** Author: Daniel Uribe
***** DB: PostgreSQL 12
*****/

/*
 * User
 */

CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(320) UNIQUE NOT NULL,
    password_hash BYTEA NOT NULL,
    password_salt BYTEA NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    is_locked BOOLEAN NOT NULL DEFAULT 0::BOOLEAN
);

CREATE OR REPLACE FUNCTION user_modified() RETURNS TRIGGER AS $user_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$user_modified$ LANGUAGE plpgsql;

CREATE TRIGGER user_modified
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION user_modified();



/*
 * RefreshToken
 */

CREATE TABLE IF NOT EXISTS refresh_tokens (
    refresh_token_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    refresh_token_expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    initial_vector BYTEA NOT NULL,
    encryption_key BYTEA NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refreshtoken_userid FOREIGN KEY (user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION refresh_token_modified() RETURNS TRIGGER AS $refresh_token_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$refresh_token_modified$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_token_modified
BEFORE UPDATE ON refresh_tokens
FOR EACH ROW EXECUTE FUNCTION refresh_token_modified();



/*
 * Tag
 */

CREATE TABLE IF NOT EXISTS tags (
    tag_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id UUID UNIQUE NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_tag_userid FOREIGN KEY (user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION tag_modified() RETURNS TRIGGER AS $tag_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$tag_modified$ LANGUAGE plpgsql;

CREATE TRIGGER tag_modified
BEFORE UPDATE ON tags
FOR EACH ROW EXECUTE FUNCTION tag_modified();



/*
 * Prompt
 */

CREATE TABLE IF NOT EXISTS prompts (
    prompt_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id UUID UNIQUE NOT NULL,
    title VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_prompt_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION prompt_modified() RETURNS TRIGGER AS $prompt_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$prompt_modified$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_modified
BEFORE UPDATE ON prompts
FOR EACH ROW EXECUTE FUNCTION prompt_modified();



/*
 * Personification
 */

CREATE TABLE IF NOT EXISTS personifications (
    personification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birthday TIMESTAMP WITH TIME ZONE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_personification_userid FOREIGN KEY (user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION personification_modified() RETURNS TRIGGER AS $personification_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$personification_modified$ LANGUAGE plpgsql;

CREATE TRIGGER personification_modified
BEFORE UPDATE ON personifications
FOR EACH ROW EXECUTE FUNCTION personification_modified();



/*
 * Short
 */

CREATE TABLE IF NOT EXISTS shorts (
    short_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id UUID UNIQUE NOT NULL,
    title VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_short_userid FOREIGN KEY (user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION short_modified() RETURNS TRIGGER AS $short_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$short_modified$ LANGUAGE plpgsql;

CREATE TRIGGER short_modified
BEFORE UPDATE ON shorts
FOR EACH ROW EXECUTE FUNCTION short_modified();



/*
 * Book
 */

CREATE TABLE IF NOT EXISTS books (
    book_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id UUID UNIQUE NOT NULL,
    title VARCHAR(50) NOT NULL,
    event_start TIMESTAMP WITH TIME ZONE NULL,
    event_end TIMESTAMP WITH TIME ZONE NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_book_userid FOREIGN KEY (user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION book_modified() RETURNS TRIGGER AS $book_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$book_modified$ LANGUAGE plpgsql;

CREATE TRIGGER book_modified
BEFORE UPDATE ON books
FOR EACH ROW EXECUTE FUNCTION book_modified();



/*
 * Chapter
 */

CREATE TABLE IF NOT EXISTS chapters (
    chapter_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    client_id UUID UNIQUE NOT NULL,
    sort_order INT NOT NULL,
    title VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_chapter_userid FOREIGN KEY (user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE,
    CONSTRAINT fk_chapter_bookid FOREIGN KEY (book_id)
        REFERENCES books(book_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION chapter_modified() RETURNS TRIGGER AS $chapter_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$chapter_modified$ LANGUAGE plpgsql;

CREATE TRIGGER chapter_modified
BEFORE UPDATE ON chapters
FOR EACH ROW EXECUTE FUNCTION chapter_modified();



/*
 * Relationship
 */

CREATE TABLE IF NOT EXISTS relationships (
    relationship_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id UUID UNIQUE NOT NULL,
    object_client_id UUID NOT NULL,
    chip_client_id UUID NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_relationship_userid FOREIGN KEY (user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION relationship_modified() RETURNS TRIGGER AS $relationship_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$relationship_modified$ LANGUAGE plpgsql;

CREATE TRIGGER relationship_modified
BEFORE UPDATE ON relationships
FOR EACH ROW EXECUTE FUNCTION relationship_modified();



/*
 * ConnectionRequest
 */

CREATE TABLE IF NOT EXISTS connection_requests (
    connection_request_id BIGSERIAL PRIMARY KEY,
    source_user_id BIGINT NOT NULL,
    destination_username VARCHAR(50) NOT NULL,
    is_accepted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    is_rejected BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_connectionrequest_sourceuserid FOREIGN KEY (source_user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE,
    CONSTRAINT fk_connectionrequest_destinationusername FOREIGN KEY (destination_username)
        REFERENCES users(username) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION connection_modified() RETURNS TRIGGER AS $connection_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$connection_modified$ LANGUAGE plpgsql;

CREATE TRIGGER connection_modified
BEFORE UPDATE ON connections
FOR EACH ROW EXECUTE FUNCTION connection_modified();



/*
 * Collaboration
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
 */

CREATE TABLE IF NOT EXISTS permission_types (
    permission_type_id INT PRIMARY KEY,
    permission_type VARCHAR(50)
);

INSERT INTO permission_types VALUES
    (1, 'READ'),
    (2, 'WRITE'),
    (3, 'READ_WRITE'),
    (4, 'DELETE'),
    (5, 'READ_DELETE'),
    (6, 'WRITE_DELETE'),
    (7, 'FULL');

CREATE TABLE IF NOT EXISTS collaboration_types (
    collaboration_type_id INT PRIMARY KEY,
    collaboration_type VARCHAR(50)
);

INSERT INTO collaboration_types VALUES
    (1, 'BOOK'),
    (2, 'CHAPTER'),
    (3, 'PERSONIFICATION'),
    (4, 'PROMPT'),
    (5, 'SHORT');

CREATE TABLE IF NOT EXISTS collaboration_scopes (
    collaboration_scope_id INT PRIMARY KEY,
    collaboration_scope VARCHAR(50)
);

INSERT INTO collaboration_scopes VALUES
    (0, 'PRIVATE'),
    (1, 'ONE_ON_ONE'),
    (2, 'ENTIRE_NETWORK'),
    (3, 'PUBLIC');

CREATE TABLE IF NOT EXISTS collaboration_topics (
    collaboration_topic_id BIGSERIAL PRIMARY KEY,
    originating_user_id BIGINT NOT NULL,
    colloraboration_type_id INT NOT NULL,
    collaboration_scope_id INT NOT NULL,
    object_client_id UUID NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_collaborationtopic_originatinguserid FOREIGN KEY (originating_user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE,
    CONSTRAINT fk_collaborationtopic_collaborationtypeid FOREIGN KEY (collaboration_type_id)
        REFERENCES collaboration_types(collaboration_type_id) MATCH FULL
        ON DELETE CASCADE,
    CONSTRAINT fk_collaborationtopic_collaborationscopeid FOREIGN KEY (collaboration_scope_id)
        REFERENCES collaboration_scopes(collaboration_scope_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION collaboration_topic_modified() RETURNS TRIGGER AS $collaboration_topic_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$collaboration_topic_modified$ LANGUAGE plpgsql;

CREATE TRIGGER collaboration_topic_modified
BEFORE UPDATE ON collaboration_topics
FOR EACH ROW EXECUTE FUNCTION collaboration_topic_modified();



CREATE TABLE IF NOT EXISTS collaboration_subscriptions (
    collaboration_subscription_id BIGSERIAL PRIMARY KEY,
    collaboration_topic_id BIGINT NOT NULL,
    subscribing_user_id BIGINT NOT NULL,
    permission_type_id INT NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
    CONSTRAINT fk_collaborationsubscription_subscribinguserid FOREIGN KEY (subscribing_user_id)
        REFERENCES users(user_id) MATCH FULL
        ON DELETE CASCADE,
    CONSTRAINT fk_collaborationsubscription_collaborationtopicid FOREIGN KEY (collaboration_topic_id)
        REFERENCES collaboration_topics(collaboration_topic_id) MATCH FULL
        ON DELETE CASCADE,
    CONSTRAINT fk_collaborationsubscription_permissiontypeid FOREIGN KEY (permission_type_id)
        REFERENCES permission_types(permission_type_id) MATCH FULL
        ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION collaboration_subscription_modified() RETURNS TRIGGER AS $collaboration_subscription_modified$
BEGIN
    NEW.modified_date := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$collaboration_subscription_modified$ LANGUAGE plpgsql;

CREATE TRIGGER collaboration_subscription_modified
BEFORE UPDATE ON collaboration_subscriptions
FOR EACH ROW EXECUTE FUNCTION collaboration_subscription_modified();
