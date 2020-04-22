import axios from 'axios';
import { apiConstants, authConstants } from '../../config/constants';
import { IAuthenticatedUser, IAuthenticationErrorState, IAuthCredentials, INewUser } from '../types';

export const isAuthTokenExpired = (authenticatedUser: IAuthenticatedUser): boolean => {
    if (!authenticatedUser || !authenticatedUser.tokenExpirationDate) return true;
    return authenticatedUser.tokenExpirationDate.getTime() < Date.now();
};

export const refreshToken = (authenticatedUser: IAuthenticatedUser) => {
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
        const url = `${apiConstants.usersController}/refresh`;
        const data = {
            refreshToken: authenticatedUser.refreshToken,
        };
        const config = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        dispatch({ type: authConstants.REFRESH_TOKEN });
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
            dispatch({ type: authConstants.REFRESH_TOKEN_SUCCESS, payload: refreshResponseDto });
        }).catch((err) => {
            const error: IAuthenticationErrorState = {
                internalErrorMessage: `Received the following error while attempting to authenticate the user with the refresh token: ${err}`,
                displayErrorMessage: `An authentication error occurred.  Return to login screen and try again.`
            }
            dispatch({ type: authConstants.REFRESH_TOKEN_ERROR, error: error });
        });
    };
};

export const signIn = (credentials: IAuthCredentials) => {
    return (dispatch: any) => {
        const url = `${apiConstants.usersController}/authenticate`;
        const data = credentials;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        dispatch({ type: authConstants.LOGIN, payload: credentials });
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
            dispatch({ type: authConstants.LOGIN_SUCCESS, payload: authResponseDto });
        }).catch((err) => {
            const error: IAuthenticationErrorState = {
                internalErrorMessage: `Received the following error while attempting to authenticate the user with the provided credentials: ${err}`,
                displayErrorMessage: `Invalid login.  Please try again.`
            }
            dispatch({ type: authConstants.LOGIN_ERROR, error: error });
        });
    };
};

export const signOut = () => {
    return (dispatch: any) => {
        dispatch({ type: authConstants.LOGOUT });
    };
};

export const signUp = (newUser: INewUser) => {
    return (dispatch: any) => {
        const url = `${apiConstants.usersController}/create`;
        const data = newUser;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        dispatch({ type: authConstants.CREATE_NEW_USER, payload: newUser });
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
            dispatch({ type: authConstants.CREATE_NEW_USER_SUCCESS, payload: createResponseDto });
        }).catch((err) => {
            // probably need a switch or series of if/else if statements to confirm this assumption
            const error: IAuthenticationErrorState = {
                internalErrorMessage: `Received the following error while attempting to create the user with the provided form data: ${err}`,
                displayErrorMessage: `Unable to register the user.  Usernames and email must both be unique.`
            }
            dispatch({ type: authConstants.CREATE_NEW_USER_ERROR, error: error });
        });
    };
};
