import axios from 'axios';
// import { useDispatch } from 'react-redux';
import { apiConstants, authConstants, offlineConstants } from '../../constants';
import { errorCodes, nullError } from '../types/errorTypes';
import { persistenceTypes } from '../types/storageTypes';
import { AuthenticatedUser, authenticatedUserFromSerializedJSON } from '../types/authTypes';

export const AuthActionMemento = (function() {
    const AuthActionMemento = function(storageManager, user, type, timestamp, serializedData = '') {
        this.storageManager = storageManager;
        if (!serializedData) {
            this.user = user;
            this.type = type;
            this.timestamp = timestamp;
            this.dehydrate();
        } else {
            this.hydrate(serializedData, user);
        }
    };
    AuthActionMemento.prototype.hydrate = function(memento, user) {
        this.serializedData = memento;
        const instance = this;
        JSON.parse(memento, (key, value) => {
            if (key === 'user' && user) instance.user = user;
            else if (key === 'user') instance.user = authenticatedUserFromSerializedJSON(instance.storageManager, value);
            else if (key === 'type') instance.type = value;
            else if (key === 'timestamp') instance.timestamp = value;
            return null;
        });
        return this;
    };
    AuthActionMemento.prototype.dehydrate = function() {
        this.serializedData = JSON.stringify({
            user: this.user.serializeObject(persistenceTypes.light),
            type: this.type,
            timestamp: this.timestamp,
        })
        return this.serializedData;
    };
    AuthActionMemento.prototype.playAction = function(replayUser, isOffline) {
        switch (this.type) {
            case authConstants.REFRESH_TOKEN:
                return this.refresh(replayUser, isOffline, true);
            case authConstants.UPDATE_USER_PROFILE:
                return this.updateProfile(replayUser, isOffline, true);
            default:
                break;
        }
    };
    AuthActionMemento.prototype.refresh = function(replayUser, isOffline, force = false) {
        return (dispatch) => {
            // const dispatch = useDispatch();
            const url = `${apiConstants.usersController}/refresh`;
            const data = {
                refreshToken: replayUser.refreshToken,
            };
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: authConstants.REFRESH_TOKEN, payload: this.user, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            if (isOffline && !force) {
                // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
                const error = Object.assign({}, nullError, { errorCode: errorCodes.apiUnreachable });
                dispatch({ type: authConstants.REFRESH_TOKEN_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                return;
            }
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                this.user.onApiProcessed(response.data);
                dispatch({ type: authConstants.REFRESH_TOKEN_SUCCESS, payload: this.user, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.resposne === undefined) {
                    // timed out or the API wasn't running
                    const error = {
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        errorCode: errorCodes.apiUnreachable,
                    };
                    dispatch({ type: authConstants.REFRESH_TOKEN_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                } else {
                    // the API responded with an exception indicating an error processing the request
                    const error = Object.assign({
                        displayErrorMessage: `An authentication error occurred.  Return to the login screen and try again.`,
                        internalErrorMessage: `Received error code [${err.code}] while attempting to authenticate the user with the provided refresh token: ${err}`,
                        errorCode: errorCodes.unknown,
                    }, err.response.data);
                    dispatch({ type: authConstants.REFRESH_TOKEN_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                }
            });
        };
    };
    AuthActionMemento.prototype.updateProfile = function(user, isOffline, force = false) {
        return (dispatch) => {
            // const dispatch = useDispatch();
            const url = `${apiConstants.usersController}/update`;
            const data = this.user.toUpdateDto();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: authConstants.UPDATE_USER_PROFILE, payload: this.user, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            if (isOffline && !force) {
                // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
                const error = Object.assign({}, nullError, { errorCode: errorCodes.apiUnreachable });
                dispatch({ type: authConstants.UPDATE_USER_PROFILE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                return;
            }
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                this.user.onApiProcessed({ profile: response.data }, true);
                dispatch({ type: authConstants.UPDATE_USER_PROFILE_SUCCESS, payload: this.user, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error = {
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        errorCode: errorCodes.apiUnreachable,
                    };
                    dispatch({ type: authConstants.UPDATE_USER_PROFILE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                } else {
                    // the API responded with an exception indicating an error processing the request
                    const error = Object.assign({
                        displayErrorMessage: `An error occurred while attempting to update the user profile.  Please check the updated fields and try again.`,
                        internalErrorMessage: `Received error code [${err.code}] while attempting to update the user profile: ${err}`,
                        errorCode: errorCodes.unknown,
                    }, err.response.data);
                    dispatch({ type: authConstants.UPDATE_USER_PROFILE_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                }
            });
        };
    };
    return AuthActionMemento;
})();

const oneDay = 1000*60*60*24;
export const isAuthTokenExpired = (storageManager, user, isOffline = false) => {
    return (dispatch) => {
        const now = Date.now();
        // if token expiration is more than 24 hrs away, do nothing
        if (user.tokenExpirationDate.getTime() < (now - oneDay)) {
            return false;
        } else if (user.refreshTokenExpirationDate.getTime() < now) {
            // so long as the refresh token has not expired or been proven to be revoked
            // the user is still authenticated, but we need to work on getting them a new
            // auth token
            if (!isOffline) refreshToken(storageManager, user, isOffline)(dispatch);
            return false;
        }
        return true;
    }
};

export const refreshToken = (storageManager, user, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new AuthActionMemento(storageManager, user, authConstants.REFRESH_TOKEN, timestamp);
    return memento.refresh(user.toReplayUser(), isOffline);
};

export const updateProfile = (storageManager, user, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new AuthActionMemento(storageManager, user, authConstants.UPDATE_USER_PROFILE, timestamp);
    return memento.updateProfile(user.toReplayUser(), isOffline);
};

export const signIn = (storageManager, authDto) => {
    return (dispatch) => {
        // const dispatch = useDispatch();
        const url = `${apiConstants.usersController}/authenticate`;
        const data = authDto;
        const config = {
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
        ).then((response) => {
            const user = new AuthenticatedUser(storageManager, response.data);
            // move this responsibility to the store
            // storageManager.track(StorageRecordType.authentication, user);
            dispatch({ type: authConstants.LOGIN_SUCCESS, payload: user, timestamp });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error = {
                    displayErrorMessage: `The API is unreachable.  Please try again once a network connection is established.`,
                    internalErrorMessage: `Unable to process login attempt: ${err}`,
                    errorCode: errorCodes.apiUnreachable,
                };
                dispatch({ type: authConstants.LOGIN_ERROR, error, timestamp });
            } else {
                // there is no offline or timeout handling for a straight-up auth error when first logging in
                const error = Object.assign({
                    displayErrorMessage: `Invalid login.  Please try again.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to authenticate the user with the provided credentials: ${err}`,
                    errorCode: errorCodes.unknown,
                }, err.response.data);
                dispatch({ type: authConstants.LOGIN_ERROR, error, timestamp });
            }
        });
    };
};

export const signOut = () => {
    return (dispatch) => {
        // const dispatch = useDispatch();
        dispatch({ type: authConstants.LOGOUT, timestamp: Date.now() });
    };
};

export const signUp = (storageManager, newUser, password, replayTimestamp = 0) => {
    return (dispatch) => {
        // const dispatch = useDispatch();
        const url = `${apiConstants.usersController}/create`;
        const data = Object.assign(newUser.toCreateDto(), { password });
        const config = {
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
        ).then((response) => {
            newUser.onApiProcessed(response.data);
            dispatch({ type: authConstants.CREATE_NEW_USER_SUCCESS, payload: newUser, timestamp });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error = {
                    displayErrorMessage: `The API is unreachable.  Please try signing up once a network connection is established.`,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: errorCodes.apiUnreachable,
                };
                dispatch({ type: authConstants.CREATE_NEW_USER_ERROR, error, timestamp });
            } else if (err.response && err.response.data && err.response.data.errorCode === errorCodes.clientIdCollided) {
                newUser.profile.handleCollision();
                signUp(storageManager, newUser, password, timestamp);
            } else {
                const error = Object.assign({
                    displayErrorMessage: `Unable to register the user.  Usernames and email must both be unique.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the user with the provided form data: ${err}`,
                    errorCode: errorCodes.unknown,
                }, err.response.data);
                dispatch({ type: authConstants.CREATE_NEW_USER_ERROR, error, timestamp });
            }
        });
    };
};

export const updatePassword = (user, passwordDto, isOffline = false) => {
    return (dispatch) => {
        // const dispatch = useDispatch();
        const url = `${apiConstants.usersController}/password`;
        const data = passwordDto;
        const config = {
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
        ).then((response) => {
            user.onApiProcessed(response.data);
            dispatch({ type: authConstants.UPDATE_USER_PASSWORD_SUCCESS, payload: user, suppressTimeoutAlert: isOffline, timestamp });
        }).catch((err) => {
            if (err.code ==='ECONNABORTED' || err.response === undefined) {
                const error = {
                    displayErrorMessage: `The API was unreachable.  Please try updating your password once a network connection is established.`,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: errorCodes.apiUnreachable,
                };
                dispatch({ type: authConstants.UPDATE_USER_PASSWORD_ERROR, error, suppressTimeoutAlert: isOffline, timestamp });
            } else {
                const error = Object.assign({
                    displayErrorMessage: `The API encountered an error while attempting to update the password.  If the problem persists contact the system administrator.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the user's password: ${err}`,
                    errorCode: errorCodes.unknown,
                }, err.response.data);
                dispatch({ type: authConstants.UPDATE_USER_PASSWORD_ERROR, error, suppressTimeoutAlert: isOffline, timestamp });
            }
        });
    };
};