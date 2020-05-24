import https from 'https';

const baseUrl = 'https://localhost:5001';

if (baseUrl.startsWith('https://localhost')) {
    // enable use of self-signed certificates when API is running on localhost
    // https.globalAgent.options.rejectUnauthorized = false;
    https.globalAgent = new https.Agent({
        rejectUnauthorized: false
    });
}

export const defaultDate = new Date(1970, 0, 0);

export const apiConstants = {
    baseUrl: baseUrl,
    usersController: `${baseUrl}/api/users`,
    leadsController: `${baseUrl}/api/leads`,
    booksController: `${baseUrl}/api/books`,
    chaptersController: `${baseUrl}/api/chapters`,
    personificationsController: `${baseUrl}/api/personifications`,
    promptsController: `${baseUrl}/api/prompts`,
    relationshipsController: `${baseUrl}/api/relationships`,
    shortsController: `${baseUrl}/api/shorts`,
    timelinesController: `${baseUrl}/api/timelines`,
    ping: `${baseUrl}/api/ping`,
    timeout: 5 * 1000,
};

export const authConstants = {
    AUTH_LOCAL_STORAGE_KEY: 'AUTH_LOCAL_STORAGE',
    AUTH_CLEAR_ERROR: 'AUTH_CLEAR_ERROR',

    LOGIN: 'LOGIN',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_ERROR: 'LOGIN_ERROR',

    LOGOUT: 'LOGOUT',

    REFRESH_TOKEN: 'REFRESH_TOKEN',
    REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
    REFRESH_TOKEN_ERROR: 'REFRESH_TOKEN_ERROR',
    REFRESH_TOKEN_TIMEOUT: 'REFRESH_TOKEN_TIMEOUT',

    CREATE_NEW_USER: 'CREATE_NEW_USER',
    CREATE_NEW_USER_SUCCESS: 'CREATE_NEW_USER_SUCCESS',
    CREATE_NEW_USER_ERROR: 'CREATE_NEW_USER_ERROR',
};

export const welcomeConstants = {
    WELCOME_CLEAR_ERROR: 'WELCOME_CLEAR_ERROR',

    EMAIL: 'EMAIL',
    EMAIL_SUCCESS: 'EMAIL_SUCCESS',
    EMAIL_ERROR: 'EMAIL_ERROR',
};

export const dashboardConstants = {
    VISIT_RECENT_ITEM: 'VISIT_RECENT_ITEM',
    VISIT_RECENT_ITEM_CLEAR: 'VISIT_RECENT_ITEM_CLEAR',
};

export const bookConstants = {
    BOOK_LOCAL_STORAGE_KEY: 'BOOK_LOCAL_STORAGE',
    BOOK_CLEAR_ERROR: 'BOOK_CLEAR_ERROR',

    CREATE_NEW_BOOK: 'CREATE_NEW_BOOK',
    CREATE_NEW_BOOK_SUCCESS: 'CREATE_NEW_BOOK_SUCCESS',
    CREATE_NEW_BOOK_ERROR: 'CREATE_NEW_BOOK_ERROR',
    CREATE_NEW_BOOK_TIMEOUT: 'CREATE_NEW_BOOK_TIMEOUT',

    READ_ALL_BOOKS: 'READ_ALL_BOOKS',
    READ_ALL_BOOKS_SUCCESS: 'READ_ALL_BOOKS_SUCCESS',
    READ_ALL_BOOKS_ERROR: 'READ_ALL_BOOKS_ERROR',
    READ_ALL_BOOKS_TIMEOUT: 'READ_ALL_BOOKS_TIMEOUT',

    READ_BOOK: 'READ_BOOK',
    READ_BOOK_SUCCESS: 'READ_BOOK_SUCCESS',
    READ_BOOK_ERROR: 'READ_BOOK_ERROR',
    READ_BOOK_TIMEOUT: 'READ_BOOK_TIMEOUT',

    UPDATE_BOOK: 'UPDATE_BOOK',
    UPDATE_BOOK_SUCCESS: 'UPDATE_BOOK_SUCCESS',
    UPDATE_BOOK_ERROR: 'UPDATE_BOOK_ERROR',
    UPDATE_BOOK_TIMEOUT: 'UPDATE_BOOK_TIMEOUT',

    DELETE_BOOK: 'DELETE_BOOK',
    DELETE_BOOK_SUCCESS: 'DELETE_BOOK_SUCCESS',
    DELETE_BOOK_ERROR: 'DELETE_BOOK_ERROR',
    DELETE_BOOK_TIMEOUT: 'DELETE_BOOK_TIMEOUT',

    SUB_ROUTES: {
        NEW_BOOK: 'NEW_BOOK',
        NEW_CHAPTER: 'NEW_CHAPTER',
        NEW_TIMELINE: 'NEW_TIMELINE',
    },
};

export const chapterConstants = {
    CHAPTER_LOCAL_STORAGE_KEY: 'CHAPTER_LOCAL_STORAGE',
    CHAPTER_CLEAR_ERROR: 'CHAPTER_CLEAR_ERROR',

    CREATE_NEW_CHAPTER: 'CREATE_NEW_CHAPTER',
    CREATE_NEW_CHAPTER_SUCCESS: 'CREATE_NEW_CHAPTER_SUCCESS',
    CREATE_NEW_CHAPTER_ERROR: 'CREATE_NEW_CHAPTER_ERROR',
    CREATE_NEW_CHAPTER_TIMEOUT: 'CREATE_NEW_CHAPTER_TIMEOUT',

    READ_ALL_CHAPTERS: 'READ_ALL_CHAPTERS',
    READ_ALL_CHAPTERS_SUCCESS: 'READ_ALL_CHAPTERS_SUCCESS',
    READ_ALL_CHAPTERS_ERROR: 'READ_ALL_CHAPTERS_ERROR',
    READ_ALL_CHAPTERS_TIMEOUT: 'READ_ALL_CHAPTERS_TIMEOUT',

    READ_CHAPTER: 'READ_CHAPTER',
    READ_CHAPTER_SUCCESS: 'READ_CHAPTER_SUCCESS',
    READ_CHAPTER_ERROR: 'READ_CHAPTER_ERROR',
    READ_CHAPTER_TIMEOUT: 'READ_CHAPTER_TIMEOUT',

    UPDATE_CHAPTER: 'UPDATE_CHAPTER',
    UPDATE_CHAPTER_SUCCESS: 'UPDATE_CHAPTER_SUCCESS',
    UPDATE_CHAPTER_ERROR: 'UPDATE_CHAPTER_ERROR',
    UPDATE_CHAPTER_TIMEOUT: 'UPDATE_CHAPTER_TIMEOUT',

    DELETE_CHAPTER: 'DELETE_CHAPTER',
    DELETE_CHAPTER_SUCCESS: 'DELETE_CHAPTER_SUCCESS',
    DELETE_CHAPTER_ERROR: 'DELETE_CHAPTER_ERROR',
    DELETE_CHAPTER_TIMEOUT: 'DELETE_CHAPTER_TIMEOUT',
};

export const personificationConstants = {
    PERSONIFICATION_LOCAL_STORAGE_KEY: 'PERSONIFICATION_LOCAL_STORAGE',
    PERSONIFICATION_CLEAR_ERROR: 'PERSONIFICATION_CLEAR_ERROR',

    CREATE_NEW_PERSONIFICATION: 'CREATE_NEW_PERSONIFICATION',
    CREATE_NEW_PERSONIFICATION_SUCCESS: 'CREATE_NEW_PERSONIFICATION_SUCCESS',
    CREATE_NEW_PERSONIFICATION_ERROR: 'CREATE_NEW_PERSONIFICATION_ERROR',
    CREATE_NEW_PERSONIFICATION_TIMEOUT: 'CREATE_NEW_PERSONIFICATION_TIMEOUT',

    READ_ALL_PERSONIFICATIONS: 'READ_ALL_PERSONIFICATIONS',
    READ_ALL_PERSONIFICATIONS_SUCCESS: 'READ_ALL_PERSONIFICATIONS_SUCCESS',
    READ_ALL_PERSONIFICATIONS_ERROR: 'READ_ALL_PERSONIFICATIONS_ERROR',
    READ_ALL_PERSONIFICATIONS_TIMEOUT: 'READ_ALL_PERSONIFICATIONS_TIMEOUT',

    READ_PERSONIFICATION: 'READ_PERSONIFICATION',
    READ_PERSONIFICATION_SUCCESS: 'READ_PERSONIFICATION_SUCCESS',
    READ_PERSONIFICATION_ERROR: 'READ_PERSONIFICATION_ERROR',
    READ_PERSONIFICATION_TIMEOUT: 'READ_PERSONIFICATION_TIMEOUT',

    UPDATE_PERSONIFICATION: 'UPDATE_PERSONIFICATION',
    UPDATE_PERSONIFICATION_SUCCESS: 'UPDATE_PERSONIFICATION_SUCCESS',
    UPDATE_PERSONIFICATION_ERROR: 'UPDATE_PERSONIFICATION_ERROR',
    UPDATE_PERSONIFICATION_TIMEOUT: 'UPDATE_PERSONIFICATION_TIMEOUT',

    DELETE_PERSONIFICATION: 'DELETE_PERSONIFICATION',
    DELETE_PERSONIFICATION_SUCCESS: 'DELETE_PERSONIFICATION_SUCCESS',
    DELETE_PERSONIFICATION_ERROR: 'DELETE_PERSONIFICATION_ERROR',
    DELETE_PERSONIFICATION_TIMEOUT: 'DELETE_PERSONIFICATION_TIMEOUT',
};

export const promptConstants = {
    PROMPT_LOCAL_STORAGE_KEY: 'PROMPT_LOCAL_STORAGE',
    PROMPT_CLEAR_ERROR: 'PROMPT_CLEAR_ERROR',

    CREATE_NEW_PROMPT: 'CREATE_NEW_PROMPT',
    CREATE_NEW_PROMPT_SUCCESS: 'CREATE_NEW_PROMPT_SUCCESS',
    CREATE_NEW_PROMPT_ERROR: 'CREATE_NEW_PROMPT_ERROR',
    CREATE_NEW_PROMPT_TIMEOUT: 'CREATE_NEW_PROMPT_TIMEOUT',

    READ_ALL_PROMPTS: 'READ_ALL_PROMPTS',
    READ_ALL_PROMPTS_SUCCESS: 'READ_ALL_PROMPTS_SUCCESS',
    READ_ALL_PROMPTS_ERROR: 'READ_ALL_PROMPTS_ERROR',
    READ_ALL_PROMPTS_TIMEOUT: 'READ_ALL_PROMPTS_TIMEOUT',

    READ_PROMPT: 'READ_PROMPT',
    READ_PROMPT_SUCCESS: 'READ_PROMPT_SUCCESS',
    READ_PROMPT_ERROR: 'READ_PROMPT_ERROR',
    READ_PROMPT_TIMEOUT: 'READ_PROMPT_TIMEOUT',

    UPDATE_PROMPT: 'UPDATE_PROMPT',
    UPDATE_PROMPT_SUCCESS: 'UPDATE_PROMPT_SUCCESS',
    UPDATE_PROMPT_ERROR: 'UPDATE_PROMPT_ERROR',
    UPDATE_PROMPT_TIMEOUT: 'UPDATE_PROMPT_TIMEOUT',

    DELETE_PROMPT: 'DELETE_PROMPT',
    DELETE_PROMPT_SUCCESS: 'DELETE_PROMPT_SUCCESS',
    DELETE_PROMPT_ERROR: 'DELETE_PROMPT_ERROR',
    DELETE_PROMPT_TIMEOUT: 'DELETE_PROMPT_TIMEOUT',
};

export const shortConstants = {
    SHORT_LOCAL_STORAGE_KEY: 'SHORT_LOCAL_STORAGE',
    SHORT_CLEAR_ERROR: 'SHORT_CLEAR_ERROR',

    CREATE_NEW_SHORT: 'CREATE_NEW_SHORT',
    CREATE_NEW_SHORT_SUCCESS: 'CREATE_NEW_SHORT_SUCCESS',
    CREATE_NEW_SHORT_ERROR: 'CREATE_NEW_SHORT_ERROR',
    CREATE_NEW_SHORT_TIMEOUT: 'CREATE_NEW_SHORT_TIMEOUT',

    READ_ALL_SHORTS: 'READ_ALL_SHORTS',
    READ_ALL_SHORTS_SUCCESS: 'READ_ALL_SHORTS_SUCCESS',
    READ_ALL_SHORTS_ERROR: 'READ_ALL_SHORTS_ERROR',
    READ_ALL_SHORTS_TIMEOUT: 'READ_ALL_SHORTS_TIMEOUT',

    READ_SHORT: 'READ_SHORT',
    READ_SHORT_SUCCESS: 'READ_SHORT_SUCCESS',
    READ_SHORT_ERROR: 'READ_SHORT_ERROR',
    READ_SHORT_TIMEOUT: 'READ_SHORT_TIMEOUT',

    UPDATE_SHORT: 'UPDATE_SHORT',
    UPDATE_SHORT_SUCCESS: 'UPDATE_SHORT_SUCCESS',
    UPDATE_SHORT_ERROR: 'UPDATE_SHORT_ERROR',
    UPDATE_SHORT_TIMEOUT: 'UPDATE_SHORT_TIMEOUT',

    DELETE_SHORT: 'DELETE_SHORT',
    DELETE_SHORT_SUCCESS: 'DELETE_SHORT_SUCCESS',
    DELETE_SHORT_ERROR: 'DELETE_SHORT_ERROR',
    DELETE_SHORT_TIMEOUT: 'DELETE_SHORT_TIMEOUT',
};

export const timelineConstants = {
    TIMELINE_LOCAL_STORAGE_KEY: 'TIMELINE_LOCAL_STORAGE',
    TIMELINE_CLEAR_ERROR: 'TIMELINE_CLEAR_ERROR',

    CREATE_NEW_TIMELINE: 'CREATE_NEW_TIMELINE',
    CREATE_NEW_TIMELINE_SUCCESS: 'CREATE_NEW_TIMELINE_SUCCESS',
    CREATE_NEW_TIMELINE_ERROR: 'CREATE_NEW_TIMELINE_ERROR',
    CREATE_NEW_TIMELINE_TIMEOUT: 'CREATE_NEW_TIMELINE_TIMEOUT',

    READ_ALL_TIMELINES: 'READ_ALL_TIMELINES',
    READ_ALL_TIMELINES_SUCCESS: 'READ_ALL_TIMELINES_SUCCESS',
    READ_ALL_TIMELINES_ERROR: 'READ_ALL_TIMELINES_ERROR',
    READ_ALL_TIMELINES_TIMEOUT: 'READ_ALL_TIMELINES_TIMEOUT',

    READ_TIMELINE: 'READ_TIMELINE',
    READ_TIMELINE_SUCCESS: 'READ_TIMELINE_SUCCESS',
    READ_TIMELINE_ERROR: 'READ_TIMELINE_ERROR',
    READ_TIMELINE_TIMEOUT: 'READ_TIMELINE_TIMEOUT',

    UPDATE_TIMELINE: 'UPDATE_TIMELINE',
    UPDATE_TIMELINE_SUCCESS: 'UPDATE_TIMELINE_SUCCESS',
    UPDATE_TIMELINE_ERROR: 'UPDATE_TIMELINE_ERROR',
    UPDATE_TIMELINE_TIMEOUT: 'UPDATE_TIMELINE_TIMEOUT',

    DELETE_TIMELINE: 'DELETE_TIMELINE',
    DELETE_TIMELINE_SUCCESS: 'DELETE_TIMELINE_SUCCESS',
    DELETE_TIMELINE_ERROR: 'DELETE_TIMELINE_ERROR',
    DELETE_TIMELINE_TIMEOUT: 'DELETE_TIMELINE_TIMEOUT',
};

export const relationshipConstants = {
    RELATIONSHIP_LOCAL_STORAGE_KEY: 'RELATIONSHIP_LOCAL_STORAGE',
    RELATIONSHIP_CLEAR_ERROR: 'RELATIONSHIP_CLEAR_ERROR',

    RELATE_ENTITIES: 'RELATE_ENTITIES',
    RELATE_ENTITIES_SUCCESS: 'RELATE_ENTITIES_SUCCESS',
    RELATE_ENTITIES_ERROR: 'RELATE_ENTITIES_ERROR',
    RELATE_ENTITIES_TIMEOUT: 'RELATE_ENTITIES_TIMEOUT',

    UNRELATE_ENTITIES: 'UNRELATE_ENTITIES',
    UNRELATE_ENTITIES_SUCCESS: 'UNRELATE_ENTITIES_SUCCESS',
    UNRELATE_ENTITIES_ERROR: 'UNRELATE_ENTITIES_ERROR',
    UNRELATE_ENTITIES_TIMEOUT: 'UNRELATE_ENTITIES_TIMEOUT',

    JOINS: {
        TAG_TO_PERSONIFICATION: 'Tag-to-Personification',
        PERSONIFICATION_TO_TAG: 'Personification-to-Tag',

        PERSONIFICATION_TO_PROMPT: 'Personification-to-Prompt',
        PROMPT_TO_PERSONIFICATION: 'Prompt-to-Personification',

        TAG_TO_PROMPT: 'Tag-to-Prompt',
        PROMPT_TO_TAG: 'Prompt-to-Tag',

        PERSONIFICATION_TO_SHORT: 'Personification-to-Short',
        SHORT_TO_PERSONIFICATION: 'Short-to-Personification',

        PROMPT_TO_SHORT: 'Prompt-to-Short',
        SHORT_TO_PROMPT: 'Short-to-Prompt',

        TAG_TO_SHORT: 'Tag-to-Short',
        SHORT_TO_TAG: 'Short-to-Tag',
    },
};

export const offlineConstants = {
    GO_OFFLINE: 'GO_OFFLINE',
    GO_ONLINE: 'GO_ONLINE',

    API_UNREACHABLE_INTERNAL_MESSAGE: 'The API is unreachable.  Queueing request to retry later.',
    API_UNREACHABLE_DISPLAY_MESSAGE: 'The API is not accessible.  Switching to offline mode.',
};

export const persistenceConstants = {
    LOCAL_STORAGE_STRATEGY: 'LOCAL_STORAGE_STRATEGY',
    COOKIE_CRUMB_STRATEGY: 'COOKIE_CRUMB_STRATEGY',

    TIER_A: 1,
    TIER_B: 2,
    TIER_C: 3,
    TIER_D: 4,
    TIER_E: 5,

    INDEX_KEY: 'INDEX_KEY',
    LAST_ACCESSED_KEY: 'LAST_ACCESSED_KEY',
    MAX_COOKIE_WRITE_ATTEMPTS: 8,

    // Expire 'Tier A' after 30 days
    EXPIRATION_MILLISECONDS_TIER_A: 30 * 24 * 60 * 60 * 1000,
    // Expire 'Tier B' after 14 days
    EXPIRATION_MILLISECONDS_TIER_B: 14 * 24 * 60 * 60 * 1000,
    // Expire 'Tier C' after 7 days
    EXPIRATION_MILLISECONDS_TIER_C: 7 * 24 * 60 * 60 * 1000,
    // Expire 'Tier D' after 1 days
    EXPIRATION_MILLISECONDS_TIER_D: 1 * 24 * 60 * 60 * 1000,
    // Expire 'Tier E' after 1 hour
    EXPIRATION_MILLISECONDS_TIER_E: 1 * 60 * 60 * 1000,
};

export const textConstants = {
    PRINTABLE_TEXT_COMMAND: 'PRINTABLE_TEXT_COMMAND',
    LINE_BREAK_COMMAND: 'LINE_BREAK_COMMAND',
    PASTE_COMMAND: 'PASTE_COMMAND',
    DELETE_COMMAND: 'DELETE_COMMAND',
    BOLD_COMMAND: 'BOLD_COMMAND',
    ITALICIZE_COMMAND: 'ITALICIZE_COMMAND',
    UNDERLINE_COMMAND: 'UNDERLINE_COMMAND',
    STRIKE_COMMAND: 'STRIKE_COMMAND',
    CLEAR_FORMATTING_COMMAND: 'CLEAR_FORMATTING_COMMAND',
};

