/**** Author: Daniel Uribe
***** DB: PostgreSQL 12
****/

/*
 * User
 */

CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(320) UNIQUE NOT NULL,
    password_hash BYTEA NOT NULL,
    password_salt BYTEA NOT NULL,
    client_id UUID UNIQUE NOT NULL,
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
 * Prompt
 */

CREATE TABLE IF NOT EXISTS prompts (
    prompt_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    client_id UUID UNIQUE NOT NULL,
    title VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    event_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
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
