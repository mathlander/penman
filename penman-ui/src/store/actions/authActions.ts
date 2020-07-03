import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, authConstants, offlineConstants } from '../../constants';
import { IReplayableAction, IReplayUser } from '../type-defs/offline-types';
import { IError, ErrorCodes, nullError } from '../type-defs/error-types';
import { IStorageManager, PersistenceTypes, StorageRecordType } from '../type-defs/storage-types';
import { IAuthDto, IAuthenticatedUser, IUpdatePasswordDto, AuthenticatedUser } from '../type-defs/auth-types';
import { IUserProfile } from '../type-defs/user-types';
import { generateUuid } from '../../utilities';

export class AuthActionMemento implements IReplayableAction {
    private _storageManager: IStorageManager;
    public user: AuthenticatedUser;
    public type: string;
    public timestamp: number;
    public serializedData: string;

    constructor(storageManager: IStorageManager, user: AuthenticatedUser, type: string, timestamp: number) {
        this._storageManager = storageManager;
        this.user = user;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = AuthActionMemento.dehydrate(this);
    }

    static hydrate(storageManager: IStorageManager, memento: string, user?: AuthenticatedUser) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'user') {
                if (user) return user;
                return AuthenticatedUser.fromSerializedJSON(storageManager, value);
            } else return value;
        });
        return new AuthActionMemento(storageManager, restoredMemento.user, restoredMemento.type, restoredMemento.timestamp);
    }

    static dehydrate(actionMemento: AuthActionMemento) {
        const serializedMemento = JSON.stringify({
            user: actionMemento.user.serialize(PersistenceTypes.light),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
        });
        return serializedMemento;
    }

    public playAction(user: IReplayUser, isOffline: boolean) {
        switch (this.type) {
            case authConstants.REFRESH_TOKEN:
                this.refresh(user, isOffline, true);
                break;
            case authConstants.UPDATE_USER_PROFILE:
                this.updateProfile(user, isOffline, true);
                break;
            default:
                break;
        }
    }

    public refresh(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.usersController}/refresh`;
        const data = {
            refreshToken: user.refreshToken,
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: authConstants.REFRESH_TOKEN, payload: this.user, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: authConstants.REFRESH_TOKEN_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.post(
            url,
            data,
            config
        ).then((response: AxiosResponse<IAuthenticatedUser>) => {
            this.user.onApiProcessed(response.data);
            dispatch({ type: authConstants.REFRESH_TOKEN_SUCCESS, payload: this.user, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.resposne === undefined) {
                // timed out or the API wasn't running
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: authConstants.REFRESH_TOKEN_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                // the API responded with an exception indicating an error processing the request
                const error: IError = Object.assign({
                    displayErrorMessage: `An authentication error occurred.  Return to the login screen and try again.`,
                    internalErrorMessage: `Received error code [${err.code}] while attempting to authenticate the user with the provided refresh token: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: authConstants.REFRESH_TOKEN_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public updateProfile(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.usersController}/update`;
        const data = this.user.toUpdateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: authConstants.UPDATE_USER_PROFILE, payload: this.user, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: authConstants.UPDATE_USER_PROFILE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.patch(
            url,
            data,
            config
        ).then((response: AxiosResponse<IUserProfile>) => {
            this.user.onApiProcessed({ profile: response.data }, true);
            dispatch({ type: authConstants.UPDATE_USER_PROFILE_SUCCESS, payload: this.user, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: authConstants.UPDATE_USER_PROFILE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                // the API responded with an exception indicating an error processing the request
                const error: IError = Object.assign({
                    displayErrorMessage: `An error occurred while attempting to update the user profile.  Please check the updated fields and try again.`,
                    internalErrorMessage: `Received error code [${err.code}] while attempting to update the user profile: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: authConstants.UPDATE_USER_PROFILE_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }
}

const oneDay = 1000*60*60*24;
export const isAuthTokenExpired = (storageManager: IStorageManager, user: AuthenticatedUser, isOffline = false) => {
    const now = Date.now();
    // if token expiration is more than 24 hrs away, do nothing
    if (user.tokenExpirationDate.getTime() < (now - oneDay)) {
        return true;
    } else if (user.refreshTokenExpirationDate.getTime() < now) {
        // so long as the refresh token has not expired or been proven to be revoked
        // the user is still authenticated, but we need to work on getting them a new
        // auth token
        if (!isOffline) refreshToken(storageManager, user, isOffline);
        return true;
    }
    return false;
};

export const refreshToken = (storageManager: IStorageManager, user: AuthenticatedUser, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new AuthActionMemento(storageManager, user, authConstants.REFRESH_TOKEN, timestamp);
    memento.refresh(user.toReplayUser(), isOffline);
};

export const updateProfile = (storageManager: IStorageManager, user: AuthenticatedUser, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new AuthActionMemento(storageManager, user, authConstants.UPDATE_USER_PROFILE, timestamp);
    memento.updateProfile(user.toReplayUser(), isOffline);
};

export const signIn = (storageManager: IStorageManager, authDto: IAuthDto) => {
    const dispatch = useDispatch();
    const url = `${apiConstants.usersController}/authenticate`;
    const data = authDto;
    const config: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: apiConstants.timeout,
    };
    const timestamp = Date.now();
    dispatch({ type: authConstants.LOGIN, payload: authDto, timestamp });
    axios.post(
        url,
        data,
        config
    ).then((response: AxiosResponse<IAuthenticatedUser>) => {
        const user = new AuthenticatedUser(storageManager, response.data);
        // move this responsibility to the store
        // storageManager.track(StorageRecordType.authentication, user);
        dispatch({ type: authConstants.LOGIN_SUCCESS, payload: user, timestamp });
    }).catch((err) => {
        if (err.code === 'ECONNABORTED' || err.response === undefined) {
            const error: IError = {
                displayErrorMessage: `The API is unreachable.  Please try again once a network connection is established.`,
                internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                errorCode: ErrorCodes.apiUnreachable,
            };
            dispatch({ type: authConstants.LOGIN_ERROR, error, timestamp });
        } else {
            // there is no offline or timeout handling for a straight-up auth error when first logging in
            const error: IError = Object.assign({
                displayErrorMessage: `Invalid login.  Please try again.`,
                internalErrorMessage: `Received error code [${err.errorCode}] while attempting to authenticate the user with the provided credentials: ${err}`,
                errorCode: ErrorCodes.unknown,
            }, err.response.data);
            dispatch({ type: authConstants.LOGIN_ERROR, error, timestamp });
        }
    });
};

export const signOut = () => {
    const dispatch = useDispatch();
    dispatch({ type: authConstants.LOGOUT, timestamp: Date.now() });
};

export const signUp = (storageManager: IStorageManager, newUser: AuthenticatedUser, password: string, replayTimestamp = 0) => {
    const dispatch = useDispatch();
    const url = `${apiConstants.usersController}/create`;
    const data = Object.assign(newUser.toCreateDto(), { password });
    const config: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: apiConstants.timeout,
    };
    const timestamp = replayTimestamp || Date.now();
    dispatch({ type: authConstants.CREATE_NEW_USER, payload: newUser, timestamp });
    axios.post(
        url,
        data,
        config
    ).then((response: AxiosResponse<IAuthenticatedUser>) => {
        newUser.onApiProcessed(response.data);
        dispatch({ type: authConstants.CREATE_NEW_USER_SUCCESS, payload: newUser, timestamp });
    }).catch((err) => {
        if (err.code === 'ECONNABORTED' || err.response === undefined) {
            const error: IError = {
                displayErrorMessage: `The API is unreachable.  Please try signing up once a network connection is established.`,
                internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                errorCode: ErrorCodes.apiUnreachable,
            };
            dispatch({ type: authConstants.CREATE_NEW_USER_ERROR, error, timestamp });
        } else if (err.response && err.response.data && err.response.data.errorCode === ErrorCodes.clientIdCollided) {
            newUser.profile.clientId = generateUuid();
            signUp(storageManager, newUser, password, timestamp);
        } else {
            const error: IError = Object.assign({
                displayErrorMessage: `Unable to register the user.  Usernames and email must both be unique.`,
                internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the user with the provided form data: ${err}`,
                errorCode: ErrorCodes.unknown,
            }, err.response.data);
            dispatch({ type: authConstants.CREATE_NEW_USER_ERROR, error, timestamp });
        }
    });
};

export const updatePassword = (storageManager: IStorageManager, user: AuthenticatedUser, passwordDto: IUpdatePasswordDto, isOffline = false) => {
    const dispatch = useDispatch();
    const url = `${apiConstants.usersController}/password`;
    const data = passwordDto;
    const config: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
        },
        timeout: apiConstants.timeout,
    };
    const timestamp = Date.now();
    // allow the user to act as a payload rather than storing the password in clear text
    dispatch({ type: authConstants.UPDATE_USER_PASSWORD, payload: user, suppressTimeoutAlert: isOffline, timestamp });
    axios.patch(
        url,
        data,
        config
    ).then((response: AxiosResponse<IAuthenticatedUser>) => {
        user.onApiProcessed(response.data);
        dispatch({ type: authConstants.UPDATE_USER_PASSWORD_SUCCESS, payload: user, suppressTimeoutAlert: isOffline, timestamp });
    }).catch((err) => {
        if (err.code ==='ECONNABORTED' || err.response === undefined) {
            const error: IError = {
                displayErrorMessage: `The API was unreachable.  Please try updating your password once a network connection is established.`,
                internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                errorCode: ErrorCodes.apiUnreachable,
            };
            dispatch({ type: authConstants.UPDATE_USER_PASSWORD_ERROR, error, suppressTimeoutAlert: isOffline, timestamp });
        } else {
            const error: IError = Object.assign({
                displayErrorMessage: `The API encountered an error while attempting to update the password.  If the problem persists contact the system administrator.`,
                internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the user's password: ${err}`,
                errorCode: ErrorCodes.unknown,
            }, err.response.data);
            dispatch({ type: authConstants.UPDATE_USER_PASSWORD_ERROR, error, suppressTimeoutAlert: isOffline, timestamp });
        }
    });
};
