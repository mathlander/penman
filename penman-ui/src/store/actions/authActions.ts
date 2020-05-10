import axios, { AxiosRequestConfig } from 'axios';
import { apiConstants, authConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IAuthenticationErrorState, IAuthCredentials, INewUser } from '../types';

export const isAuthTokenExpired = (authenticatedUser: IAuthenticatedUser, suppressTimeoutAlert: boolean, refresh: (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => any): boolean => {
    const now = Date.now();
    if (authenticatedUser.refreshTokenExpirationDate.getTime() < now) {
        return true;
    } else if (authenticatedUser.tokenExpirationDate.getTime() < now) {
        // fall-back on refreshToken
        refresh(authenticatedUser, suppressTimeoutAlert);
    }
    return false;
};

export const refreshToken = (authenticatedUser: IAuthenticatedUser, suppressTimeoutAlert = false) => {
    /**
     * In order to take advantage of this feature, this method will need to be
     * bound to a connected component's properties.  For example:
     * 
     *      componentDidMount() {
     *          if (this.props.isAuthTokenExpired(this.props.authenticatedUser)) {
     *              this.props.refreshToken(this.props.authenticatedUser)
     *          }
     *      }
     */
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.usersController}/refresh`;
            const data = {
                refreshToken: authenticatedUser.refreshTokenExpirationDate.getTime() >= user.refreshTokenExpirationDate.getTime()
                    ? authenticatedUser.refreshToken
                    : user.refreshToken,
            };
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: authConstants.REFRESH_TOKEN, timestamp, suppressTimeoutAlert });
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const refreshResponseDto: IAuthenticatedUser = response.data;
                refreshResponseDto.tokenExpirationDate = new Date(response.data.tokenExpirationDate);
                refreshResponseDto.refreshTokenExpirationDate = new Date(response.data.refreshTokenExpirationDate);
                refreshResponseDto.createdDate = new Date(response.data.createdDate);
                refreshResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: authConstants.REFRESH_TOKEN_SUCCESS, payload: refreshResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IAuthenticationErrorState = {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: authConstants.REFRESH_TOKEN_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IAuthenticationErrorState = {
                        internalErrorMessage: `Received the following error while attempting to authenticate the user with the refresh token: ${err}`,
                        displayErrorMessage: `An authentication error occurred.  Return to login screen and try again.`
                    }
                    dispatch({ type: authConstants.REFRESH_TOKEN_ERROR, error: error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authenticatedUser, suppressTimeoutAlert);
    };
};

export const signIn = (credentials: IAuthCredentials) => {
    return (dispatch: any) => {
        const url = `${apiConstants.usersController}/authenticate`;
        const data = credentials;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        dispatch({ type: authConstants.LOGIN, payload: credentials, timestamp });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            const authResponseDto: IAuthenticatedUser = response.data;
            authResponseDto.tokenExpirationDate = new Date(response.data.tokenExpirationDate);
            authResponseDto.refreshTokenExpirationDate = new Date(response.data.refreshTokenExpirationDate);
            authResponseDto.createdDate = new Date(response.data.createdDate);
            authResponseDto.modifiedDate = new Date(response.data.modifiedDate);
            dispatch({ type: authConstants.LOGIN_SUCCESS, payload: authResponseDto, timestamp });
        }).catch((err) => {
            const error: IAuthenticationErrorState = {
                internalErrorMessage: `Received the following error while attempting to authenticate the user with the provided credentials: ${err}`,
                displayErrorMessage: `Invalid login.  Please try again.`
            }
            dispatch({ type: authConstants.LOGIN_ERROR, error: error, timestamp });
        });
    };
};

export const signOut = () => {
    return (dispatch: any) => {
        dispatch({ type: authConstants.LOGOUT, timestamp: Date.now() });
    };
};

export const signUp = (newUser: INewUser) => {
    return (dispatch: any) => {
        const url = `${apiConstants.usersController}/create`;
        const data = newUser;
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
        ).then((response) => {
            const createResponseDto: IAuthenticatedUser = response.data;
            createResponseDto.tokenExpirationDate = new Date(response.data.tokenExpirationDate);
            createResponseDto.refreshTokenExpirationDate = new Date(response.data.refreshTokenExpirationDate);
            createResponseDto.createdDate = new Date(response.data.createdDate);
            createResponseDto.modifiedDate = new Date(response.data.modifiedDate);
            dispatch({ type: authConstants.CREATE_NEW_USER_SUCCESS, payload: createResponseDto, timestamp });
        }).catch((err) => {
            // probably need a switch or series of if/else if statements to confirm this assumption
            const error: IAuthenticationErrorState = {
                internalErrorMessage: `Received the following error while attempting to create the user with the provided form data: ${err}`,
                displayErrorMessage: `Unable to register the user.  Usernames and email must both be unique.`
            }
            dispatch({ type: authConstants.CREATE_NEW_USER_ERROR, error: error, timestamp });
        });
    };
};
