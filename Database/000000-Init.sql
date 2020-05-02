/**** Schema defined by: Daniel Uribe
***** Written against: PostgreSQL 12
*****/

/*
 * Author
 */

CREATE TABLE IF NOT EXISTS author (
	author_id BIGSERIAL PRIMARY KEY,
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

CREATE OR REPLACE FUNCTION author_modified() RETURNS TRIGGER AS $author_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$author_modified$ LANGUAGE plpgsql;

CREATE TRIGGER author_modified
BEFORE UPDATE ON author
FOR EACH ROW EXECUTE FUNCTION author_modified();



/*
 * RefreshToken
 */

CREATE TABLE IF NOT EXISTS refresh_token (
	refresh_token_id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL,
	refresh_token_expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
	initial_vector BYTEA NOT NULL,
	encryption_key BYTEA NOT NULL,
	is_revoked BOOLEAN NOT NULL DEFAULT 0::BOOLEAN,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_RefreshToken_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION refresh_token_modified() RETURNS TRIGGER AS $refresh_token_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$refresh_token_modified$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_token_modified
BEFORE UPDATE ON refresh_token
FOR EACH ROW EXECUTE FUNCTION refresh_token_modified();



/*
 * Tag
 */

CREATE TABLE IF NOT EXISTS tag (
	tag_id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL,
	tag_name VARCHAR(50) NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_Tag_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION tag_modified() RETURNS TRIGGER AS $tag_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$tag_modified$ LANGUAGE plpgsql;

CREATE TRIGGER tag_modified
BEFORE UPDATE ON tag
FOR EACH ROW EXECUTE FUNCTION tag_modified();



/*
 * Prompt
 */

CREATE TABLE IF NOT EXISTS prompt (
	prompt_id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL,
	body TEXT NOT NULL,
	title VARCHAR(50) NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_Prompt_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION prompt_modified() RETURNS TRIGGER AS $prompt_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$prompt_modified$ LANGUAGE plpgsql;

CREATE TRIGGER prompt_modified
BEFORE UPDATE ON prompt
FOR EACH ROW EXECUTE FUNCTION prompt_modified();



/*
 * Personification
 */

CREATE TABLE IF NOT EXISTS personification (
	personification_id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL,
	first_name VARCHAR(50) NOT NULL,
	middle_name VARCHAR(50) NOT NULL DEFAULT '',
	last_name VARCHAR(50) NOT NULL,
	birthday TIMESTAMP WITH TIME ZONE NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_Personification_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION personification_modified() RETURNS TRIGGER AS $personification_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$personification_modified$ LANGUAGE plpgsql;

CREATE TRIGGER personification_modified
BEFORE UPDATE ON personification
FOR EACH ROW EXECUTE FUNCTION personification_modified();



/*
 * Short
 */

CREATE TABLE IF NOT EXISTS short (
	short_id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL,
	body TEXT NOT NULL,
	title VARCHAR(50) NOT NULL,
	event_start TIMESTAMP WITH TIME ZONE NOT NULL,
	event_end TIMESTAMP WITH TIME ZONE NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_Short_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION short_modified() RETURNS TRIGGER AS $short_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$short_modified$ LANGUAGE plpgsql;

CREATE TRIGGER short_modified
BEFORE UPDATE ON short
FOR EACH ROW EXECUTE FUNCTION short_modified();



/*
 * Timeline
 */

CREATE TABLE IF NOT EXISTS timeline (
	timeline_id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL,
	title VARCHAR(50) NOT NULL,
	event_start TIMESTAMP WITH TIME ZONE NOT NULL,
	event_end TIMESTAMP WITH TIME ZONE NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_Timeline_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION timeline_modified() RETURNS TRIGGER AS $timeline_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$timeline_modified$ LANGUAGE plpgsql;

CREATE TRIGGER timeline_modified
BEFORE UPDATE ON timeline
FOR EACH ROW EXECUTE FUNCTION timeline_modified();



/*
 * Book
 */

CREATE TABLE IF NOT EXISTS book (
	book_id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL,
	timeline_id BIGINT NULL,
	title VARCHAR(50) NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_Book_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_Book_TimelineId FOREIGN KEY (timeline_id)
		REFERENCES timeline(timeline_id) MATCH SIMPLE
		ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION book_modified() RETURNS TRIGGER AS $book_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$book_modified$ LANGUAGE plpgsql;

CREATE TRIGGER book_modified
BEFORE UPDATE ON book
FOR EACH ROW EXECUTE FUNCTION book_modified();



/*
 * Chapter
 */

CREATE TABLE IF NOT EXISTS chapter (
	chapter_id BIGSERIAL PRIMARY KEY,
	author_id BIGINT NOT NULL,
	book_id BIGINT NOT NULL,
	timeline_id BIGINT NULL,
	title VARCHAR(50) NOT NULL,
	created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT FK_Chapter_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_Chapter_BookId FOREIGN KEY (book_id)
		REFERENCES book(book_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_Chapter_TimelineId FOREIGN KEY (timeline_id)
		REFERENCES timeline(timeline_id) MATCH SIMPLE
		ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION chapter_modified() RETURNS TRIGGER AS $chapter_modified$
BEGIN
	NEW.modified_date := CURRENT_TIMESTAMP;
	RETURN NEW;
END;
$chapter_modified$ LANGUAGE plpgsql;

CREATE TRIGGER chapter_modified
BEFORE UPDATE ON chapter
FOR EACH ROW EXECUTE FUNCTION chapter_modified();



/*
 * Joins
 */

CREATE TABLE IF NOT EXISTS prompt_tag_join (
	prompt_id BIGINT NOT NULL,
	tag_id BIGINT NOT NULL,
	author_id BIGINT NOT NULL,
	CONSTRAINT FK_PromptTagJoin_PromptId FOREIGN KEY (prompt_id)
		REFERENCES prompt(prompt_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_PromptTagJoin_TagId FOREIGN KEY (tag_id)
		REFERENCES tag(tag_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_PromptTagJoin_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE,
	PRIMARY KEY (prompt_id, tag_id)
);

CREATE TABLE IF NOT EXISTS prompt_personification_join (
	prompt_id BIGINT NOT NULL,
	personification_id BIGINT NOT NULL,
	author_id BIGINT NOT NULL,
	CONSTRAINT FK_PromptPersonificationJoin_PromptId FOREIGN KEY (prompt_id)
		REFERENCES prompt(prompt_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_PromptPersonificationJoin_PersonificationId FOREIGN KEY (personification_id)
		REFERENCES personification(personification_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_PromptPersonificationJoin_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE,
	PRIMARY KEY (prompt_id, personification_id)
);

CREATE TABLE IF NOT EXISTS personification_tag_join (
	personification_id BIGINT NOT NULL,
	tag_id BIGINT NOT NULL,
	author_id BIGINT NOT NULL,
	CONSTRAINT FK_PersonificationTagJoin_PersonificationId FOREIGN KEY (personification_id)
		REFERENCES personification(personification_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_PersonificationTagJoin_TagId FOREIGN KEY (tag_id)
		REFERENCES tag(tag_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_PersonificationTagJoin_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE,
	PRIMARY KEY (personification_id, tag_id)
);

CREATE TABLE IF NOT EXISTS short_personification_join (
	short_id BIGINT NOT NULL,
	personification_id BIGINT NOT NULL,
	author_id BIGINT NOT NULL,
	CONSTRAINT FK_ShortPersonificationJoin_ShortId FOREIGN KEY (short_id)
		REFERENCES short(short_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_ShortPersonificationJoin_PersonificationId FOREIGN KEY (personification_id)
		REFERENCES personification(personification_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_ShortPersonificationJoin_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE,
	PRIMARY KEY (short_id, personification_id)
);

CREATE TABLE IF NOT EXISTS short_tag_join (
	short_id BIGINT NOT NULL,
	tag_id BIGINT NOT NULL,
	author_id BIGINT NOT NULL,
	CONSTRAINT FK_ShortTagJoin_ShortId FOREIGN KEY (short_id)
		REFERENCES short(short_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_ShortTagJoin_TagId FOREIGN KEY (tag_id)
		REFERENCES tag(tag_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_ShortTagJoin_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE,
	PRIMARY KEY (short_id, tag_id)
);

CREATE TABLE IF NOT EXISTS short_prompt_join (
	short_id BIGINT NOT NULL,
	prompt_id BIGINT NOT NULL,
	author_id BIGINT NOT NULL,
	CONSTRAINT FK_ShortPromptJoin_ShortId FOREIGN KEY (short_id)
		REFERENCES short(short_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_ShortPromptJoin_PromptId FOREIGN KEY (prompt_id)
		REFERENCES prompt(prompt_id) MATCH FULL
		ON DELETE CASCADE,
	CONSTRAINT FK_ShortPromptJoin_AuthorId FOREIGN KEY (author_id)
		REFERENCES author(author_id) MATCH FULL
		ON DELETE CASCADE,
	PRIMARY KEY (short_id, prompt_id)
);

