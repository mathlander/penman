import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, authConstants, offlineConstants } from '../../constants';
import { IReplayableAction, AuthenticatedUser, IReplayUser, IError, ErrorCodes } from '../types';
import { IAuthDto, IAuthenticatedUser, IUpdatePasswordDto, IUserProfile } from '../type-defs/auth-types';

export class AuthActionMemento implements IReplayableAction {
    public profile: AuthenticatedUser;
    public type: string;
    public timestamp: number;
    public serializedData: string;

    constructor(profile: AuthenticatedUser, type: string, timestamp: number) {
        this.profile = profile;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = AuthActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'profile') return AuthenticatedUser.fromSerializedJSON(value);
            else return value;
        });
        return new AuthActionMemento(restoredMemento.profile, restoredMemento.type, restoredMemento.timestamp);
    }

    static dehydrate(actionMemento: AuthActionMemento) {
        const serializedMemento = JSON.stringify({
            profile: actionMemento.profile.toSerializedJSON(),
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
        dispatch({ type: authConstants.REFRESH_TOKEN, payload: this.profile, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        axios.post(
            url,
            data,
            config
        ).then((response: AxiosResponse<IAuthenticatedUser>) => {
            this.profile.onApiProcessed(response.data);
            dispatch({ type: authConstants.REFRESH_TOKEN_SUCCESS, payload: this.profile, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                }
                dispatch({ type: authConstants.REFRESH_TOKEN_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                // the api responded with an exception indicating an error processing the request
                const error: IError = Object.assign({
                    displayErrorMessage: `An authentication error occurred.  Return to login screen and try again.`,
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
        const data = this.profile.toUpdateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.userId}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: authConstants.UPDATE_USER_PROFILE, payload: this.profile, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        axios.patch(
            url,
            data,
            config
        ).then((response: AxiosResponse<IUserProfile>) => {
            this.profile.onApiProcessed(response.data);
            dispatch({ type: authConstants.UPDATE_USER_PROFILE_SUCCESS, payload: this.profile, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                }
                dispatch({ type: authConstants.UPDATE_USER_PROFILE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                // the api responded with an exception indicating an error processing the request
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
export const isAuthTokenExpired = (user: AuthenticatedUser, isOffline: boolean) => {
    const now = Date.now();
    // avoid loss of work, where possible by requesting a new token a day before it expires
    if (user.tokenExpirationDate.getTime() < (now - oneDay)) {
        return true;
    } else if (user.refreshTokenExpirationDate.getTime() < now) {
        // if the refresh token is still valid, then fall-back on refreshToken
        // but don't keep queueing up the requests
        if (!isOffline) refreshToken(user, isOffline);
        return true;
    }
    return false;
}

export const refreshToken = (user: AuthenticatedUser, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new AuthActionMemento(user, authConstants.REFRESH_TOKEN, timestamp);
    memento.refresh(user, isOffline);
};

export const updateProfile = (user: AuthenticatedUser, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new AuthActionMemento(user, authConstants.UPDATE_USER_PROFILE, timestamp);
    memento.updateProfile(user, isOffline);
}

export const signIn = (authDto: IAuthDto) => {
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
        const user = new AuthenticatedUser(response.data);
        dispatch({ type: authConstants.LOGIN_SUCCESS, payload: user, timestamp });
    }).catch((err) => {
        if (err.code === 'ECONNABORTED' || err.response === undefined) {
            const error: IError = {
                displayErrorMessage: `The API was unreachable.  Please try again once a network connection is established.`,
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

export const signUp = (newUser: AuthenticatedUser, password: string) => {
    const dispatch = useDispatch();
    const url = `${apiConstants.usersController}/create`;
    const data = Object.assign(newUser.toCreateDto(), { password });
    const config: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: apiConstants.timeout,
    };
    const timestamp = Date.now();
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
                displayErrorMessage: `The API was unreachable.  Please try signing up once a network connection is established.`,
                internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                errorCode: ErrorCodes.apiUnreachable,
            };
            // dispatch({ type: authConstants.CREATE_NEW_USER_TIMEOUT, error, timestamp });
            dispatch({ type: authConstants.CREATE_NEW_USER_ERROR, error, timestamp });
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

export const updatePassword = (user: AuthenticatedUser, passwordDto: IUpdatePasswordDto, isOffline: boolean) => {
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
        if (err.code === 'ECONNABORTED' || err.response === undefined) {
            const error: IError = {
                displayErrorMessage: `The API was unreachable.  Please try updating your password once a network connection is established.`,
                internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                errorCode: ErrorCodes.apiUnreachable,
            };
            dispatch({ type: authConstants.UPDATE_USER_PASSWORD_TIMEOUT, error, suppressTimeoutAlert: isOffline, timestamp });
        } else {
            const error: IError = Object.assign({
                displayErrorMessage: `The API encountered an error while attempting to update the password.  If the problem persists contact the system administrator.`,
                internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the user's password: ${err}`,
                errorCode: ErrorCodes.unknown,
            }, err.response.data);
            dispatch({ type: authConstants.UPDATE_USER_PASSWORD_ERROR, error, suppressTimeoutAlert: isOffline, timestamp });
        }
    })
};
