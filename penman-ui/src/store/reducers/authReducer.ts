import { authConstants } from '../../config/constants';
import { IAuthenticatedUser, IAuthenticationErrorState, IAuthenticationState, IAuthReducerAction } from '../types';

const localStorageUser: IAuthenticatedUser | null = JSON.parse(localStorage.getItem(authConstants.AUTH_LOCAL_STORAGE_KEY) || 'null');
const nullErrorState: IAuthenticationErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};
const initState: IAuthenticationState = {
    authenticatedUser: localStorageUser,
    authErrorState: nullErrorState,
};

const authReducer = (state: IAuthenticationState = initState, action: IAuthReducerAction): IAuthenticationState => {
    switch (action.type) {
        case authConstants.LOGIN_SUCCESS:
            const authenticatedUser: IAuthenticatedUser = action.payload;
            return {
                ...state,
                authenticatedUser: authenticatedUser,
                authErrorState: nullErrorState,
            };
        case authConstants.LOGIN_ERROR:
            return {
                ...state,
                authErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to authenticate the user.',
                    displayErrorMessage: 'An error occurred while attempting to authenticate the user.',
                },
            };
        case authConstants.LOGOUT:
            localStorage.clear();
            return {
                ...state,
                authenticatedUser: null,
                authErrorState: nullErrorState,
            };

        case authConstants.REFRESH_TOKEN:
            return state;
        case authConstants.REFRESH_TOKEN_SUCCESS:
            const refreshedUser: IAuthenticatedUser = action.payload;
            localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, JSON.stringify(refreshedUser));
            return {
                ...state,
                authenticatedUser: refreshedUser,
                authErrorState: nullErrorState,
            };
        case authConstants.REFRESH_TOKEN_ERROR:
            localStorage.clear();
            return {
                ...state,
                authenticatedUser: null,
                authErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to authenticate the user with the cached refresh token.',
                    displayErrorMessage: 'An error occurred while attempting to authenticate the user.',
                },
            };

        case authConstants.CREATE_NEW_USER:
            return state;
        case authConstants.CREATE_NEW_USER_SUCCESS:
            const createdUser: IAuthenticatedUser = action.payload;
            localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, JSON.stringify(createdUser));
            return {
                ...state,
                authenticatedUser: createdUser,
                authErrorState: nullErrorState,
            };
        case authConstants.CREATE_NEW_USER_ERROR:
            return {
                ...state,
                authErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to create a new user.',
                    displayErrorMessage: 'An error occurred while attempting to create a new user.',
                }
            }

        default:
            return state;
    }
}

export default authReducer;
