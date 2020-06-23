import { authConstants, offlineConstants } from '../../constants';
import { AuthenticatedUser, IAuthenticatedUser, IError, IAuthenticationState, IAuthenticationAction, nullUser, nullError, defaultAuthenticationState } from '../types';
import { AuthActionMemento } from '../actions/authActions';
import { deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { ErrorCodes } from '../type-defs/error-types';

const readLocalStorage = (): IAuthenticationState => {
    let fromStorage = localStorage.getItem(authConstants.AUTH_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    return Object.assign(
        {},
        defaultAuthenticationState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => AuthActionMemento.hydrate(memento));
            } else if (key === 'authenticatedUser') {
                return new AuthenticatedUser(value);
            }
            return value;
        }));
};

const updateLocalStorage = (state: IAuthenticationState): void => {
    localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        authenticatedUser: state.authenticatedUser.toSerializedJSON(),
        authErrorState: nullError,
        pendingActions: [],
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
    })));
};

const initState: IAuthenticationState = readLocalStorage();

const authReducer = (state: IAuthenticationState = initState, action: IAuthenticationAction): IAuthenticationState => {
    let nextState = state;
    switch (action.type) {
        case authConstants.AUTH_CLEAR_ERROR:
            nextState = {
                ...state,
                authErrorState: nullError,
            };
            updateLocalStorage(nextState);
            return nextState;
        case authConstants.CANCEL_AUTH_ACTION:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case authConstants.LOGIN:
            nextState = {
                ...state,
                pendingActions: [...state.pendingActions, action],
            };
            return nextState;
        case authConstants.LOGIN_SUCCESS:
            const authenticatedUser: AuthenticatedUser = action.payload;
            nextState = {
                ...state,
                authenticatedUser: authenticatedUser,
                authErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case authConstants.LOGIN_ERROR:
            return {
                ...state,
                authErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to authenticate the user.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to authenticate the user.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
        case authConstants.LOGOUT:
            // remove all cached items from all states/reducers on logout
            localStorage.clear();
            return defaultAuthenticationState;

        case authConstants.REFRESH_TOKEN:
            nextState = {
                ...state,
                pendingActions: state.pendingActions
                    .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.REFRESH_TOKEN)
                    .concat(action),
                offlineActionQueue: state.offlineActionQueue
                    .filter(queuedAction => queuedAction.timestamp !== action.timestamp && queuedAction.type !== authConstants.REFRESH_TOKEN),
            };
            return nextState;
        case authConstants.REFRESH_TOKEN_SUCCESS:
            const refreshedUser: AuthenticatedUser = action.payload;
            nextState = {
                ...state,
                authenticatedUser: refreshedUser,
                authErrorState: nullError,
                pendingActions: state.pendingActions
                    .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.REFRESH_TOKEN),
                offlineActionQueue: state.offlineActionQueue
                    .filter(queuedAction => queuedAction.type !== authConstants.REFRESH_TOKEN),
            };
            updateLocalStorage(nextState);
            return nextState;
        case authConstants.REFRESH_TOKEN_ERROR:
            // treat the same as a logout
            localStorage.clear();
            nextState = {
                ...defaultAuthenticationState,
                authErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to authenticate the user.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to authenticate the user with the cached refresh token.',
                    errorCode: ErrorCodes.unknown,
                },
            };
            return nextState;
        case authConstants.REFRESH_TOKEN_TIMEOUT:
            // if more than one refresh token is queued, keep only the most recent
            nextState = {
                ...state,
                authErrorState: action.suppressTimeoutAlert
                    ? state.authErrorState
                    : action.error || {
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        errorCode: ErrorCodes.apiUnreachable,
                    },
                pendingActions: state.pendingActions
                    .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.REFRESH_TOKEN),
                offlineActionQueue: state.offlineActionQueue
                    .filter(queuedAction => queuedAction.type !== authConstants.REFRESH_TOKEN),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case authConstants.CREATE_NEW_USER:
            nextState = {
                ...state,
                pendingActions: [...state.pendingActions, action],
            };
            return nextState;
        case authConstants.CREATE_NEW_USER_SUCCESS:
            const createdUser: AuthenticatedUser = action.payload;
            nextState = {
                ...state,
                authenticatedUser: createdUser,
                authErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
        case authConstants.CREATE_NEW_USER_TIMEOUT:
        case authConstants.CREATE_NEW_USER_ERROR:
            nextState = {
                ...state,
                authErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to create a new user.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to create a new user.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            return nextState;

        case authConstants.DEACTIVATE_USER_ACCOUNT:
        case authConstants.DEACTIVATE_USER_ACCOUNT_SUCCESS:
        case authConstants.DEACTIVATE_USER_ACCOUNT_ERROR:
        case authConstants.DEACTIVATE_USER_ACCOUNT_TIMEOUT:
        case authConstants.UPDATE_USER_PASSWORD:
        case authConstants.UPDATE_USER_PASSWORD_SUCCESS:
        case authConstants.UPDATE_USER_PASSWORD_ERROR:
        case authConstants.UPDATE_USER_PASSWORD_TIMEOUT:
        case authConstants.UPDATE_USER_PROFILE:
        case authConstants.UPDATE_USER_PROFILE_SUCCESS:
        case authConstants.UPDATE_USER_PROFILE_ERROR:
        case authConstants.UPDATE_USER_PROFILE_TIMEOUT:
        default:
            return state;
    }
};

export default authReducer;
