import { offlineConstants } from '../../constants';

export const errorCodes = {
    none: 0,

    // server
    unknown: 1000,
    clientIdCollision: 1001,
    unauthorizedAction: 1002,
    authenticationFailure: 1003,
    accountDeleted: 1004,
    accountLocked: 1005,
    refreshTokenExpired: 1006,
    invalidRefreshToken: 1007,

    // client
    apiUnreachable: 2000,
    dependencyNoLongerExists: 2001,
};

export const nullError = {
    errorCode: errorCodes.none,
    internalErrorMessage: '',
    displayErrorMessage: '',
};

export const apiUnreachable = {
    errorCode: errorCodes.apiUnreachable,
    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
};
