import { offlineConstants } from '../../constants';

export enum ErrorCodes {
    none = 0,

    // server
    unknown = 1000,
    clientIdCollided = 1001,
    unauthorziedAction = 1002,
    authenticationFailed = 1003,
    accountDeleted = 1004,
    accountLocked = 1005,
    refreshTokenExpired = 1006,
    invalidRefreshToken = 1007,

    // client
    apiUnreachable = 2000,
    dependencyNoLongerExists = 2001,
};

export interface IError {
    errorCode: ErrorCodes,
    internalErrorMessage: string;
    displayErrorMessage: string;
};

export const nullError: IError = {
    errorCode: ErrorCodes.none,
    internalErrorMessage: '',
    displayErrorMessage: '',
};

export const apiUnreachable: IError = {
    errorCode: ErrorCodes.apiUnreachable,
    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
};
