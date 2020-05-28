import { authConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IAuthenticationErrorState, IAuthenticationState, IAuthReducerAction } from '../types';
import { AuthActionMemento } from '../actions/authActions';

export const expiredUser: IAuthenticatedUser = {
    token: '',
    refreshToken: '',
    tokenExpirationDate: new Date(1970),
    refreshTokenExpirationDate: new Date(1970),
    authorId: 0,
    username: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    createdDate: new Date(),
    modifiedDate: new Date(),
};

export const nullErrorState: IAuthenticationErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IAuthenticationState => {
    let localStorageState: IAuthenticationState = JSON.parse(localStorage.getItem(authConstants.AUTH_LOCAL_STORAGE_KEY) || 'null', (key: string, value: any) => {
        if (key === 'pendingActions' || key === 'offlineActionQueue') {
            return value.map((memento: string) => AuthActionMemento.hydrate(memento));
        } else if (key === 'authenticatedUser') {
            value.tokenExpirationDate = new Date(value.tokenExpirationDate);
            value.refreshTokenExpirationDate = new Date(value.refreshTokenExpirationDate);
            value.createdDate = new Date(value.createdDate);
            value.modifiedDate = new Date(value.modifiedDate);
        }
        return value;
    }) || {
        authenticatedUser: expiredUser,
        authErrorState: nullErrorState,
        pendingActions: [],
        offlineActionQueue: [],
    };
    return localStorageState;
};

const updateLocalStorage = (state: IAuthenticationState) : void => {
    localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, JSON.stringify({
        authenticatedUser: state.authenticatedUser,
        authErrorState: nullErrorState,
        pendingActions: state.pendingActions.map(actionMemento => actionMemento.serializedData),
        offlineActionQueue: state.offlineActionQueue.map(actionMemento => actionMemento.serializedData),
    }));
};

const initState: IAuthenticationState = readLocalStorage();

const authReducer = (state: IAuthenticationState = initState, action: IAuthReducerAction): IAuthenticationState => {
    let nextState = initState;
    switch (action.type) {
        case authConstants.AUTH_CLEAR_ERROR:
            nextState = {
                ...state,
                authErrorState: nullErrorState,
            };
            updateLocalStorage(nextState);
            return nextState;

        case authConstants.LOGIN:
            nextState = {
                ...state,
                pendingActions: [...state.pendingActions],
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            return nextState;
        case authConstants.LOGIN_SUCCESS:
            const authenticatedUser: IAuthenticatedUser = action.payload;
            nextState = {
                ...state,
                authenticatedUser: authenticatedUser,
                authErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case authConstants.LOGIN_ERROR:
            return {
                ...state,
                authErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to authenticate the user.',
                    displayErrorMessage: 'An error occurred while attempting to authenticate the user.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
        case authConstants.LOGOUT:
            // remove all cached items from all states/reducers on logout
            localStorage.clear();
            nextState = {
                ...state,
                authenticatedUser: expiredUser,
                authErrorState: nullErrorState,
                pendingActions: [],
            };
            return nextState;

        case authConstants.REFRESH_TOKEN:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            return nextState;
        case authConstants.REFRESH_TOKEN_SUCCESS:
            const refreshedUser: IAuthenticatedUser = action.payload;
            nextState = {
                ...state,
                authenticatedUser: refreshedUser,
                authErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case authConstants.REFRESH_TOKEN_ERROR:
            localStorage.clear();
            return {
                ...state,
                authenticatedUser: expiredUser,
                authErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to authenticate the user with the cached refresh token.',
                    displayErrorMessage: 'An error occurred while attempting to authenticate the user.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
        case authConstants.REFRESH_TOKEN_TIMEOUT:
            // only the most recent attempt at the refresh token should be replayed
            nextState = {
                ...state,
                authErrorState: action.suppressTimeoutAlert
                    ? state.authErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => !queuedAction.type.startsWith(authConstants.REFRESH_TOKEN)),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case authConstants.CREATE_NEW_USER:
            nextState = {
                ...state,
                pendingActions: [...state.pendingActions],
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            return nextState;
        case authConstants.CREATE_NEW_USER_SUCCESS:
            const createdUser: IAuthenticatedUser = action.payload;
            nextState = {
                ...state,
                authenticatedUser: createdUser,
                authErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case authConstants.CREATE_NEW_USER_ERROR:
            return {
                ...state,
                authErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to create a new user.',
                    displayErrorMessage: 'An error occurred while attempting to create a new user.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };

        default:
            return state;
    }
}

export default authReducer;
