import https from 'https';

const baseUrl = 'https://localhost:5001';

if (baseUrl.startsWith('https://localhost')) {
    // enable use of self-signed certificates when API is running on localhost
    // https.globalAgent.options.rejectUnauthorized = false;
    https.globalAgent = new https.Agent({
        rejectUnauthorized: false
    });
}

export const apiConstants = {
    baseUrl: baseUrl,
    usersController: `${baseUrl}/users`,
    leadsController: `${baseUrl}/leads`,
};

export const authConstants = {
    AUTH_LOCAL_STORAGE_KEY: 'AUTH_LOCAL_STORAGE',

    LOGIN: 'LOGIN',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_ERROR: 'LOGIN_ERROR',

    LOGOUT: 'LOGOUT',

    REFRESH_TOKEN: 'REFRESH_TOKEN',
    REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
    REFRESH_TOKEN_ERROR: 'REFRESH_TOKEN_ERROR',

    CREATE_NEW_USER: 'CREATE_NEW_USER',
    CREATE_NEW_USER_SUCCESS: 'CREATE_NEW_USER_SUCCESS',
    CREATE_NEW_USER_ERROR: 'CREATE_NEW_USER_ERROR',
};

export const welcomeConstants = {
    EMAIL: 'EMAIL',
    EMAIL_SUCCESS: 'EMAIL_SUCCESS',
    EMAIL_ERROR: 'EMAIL_ERROR',
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
