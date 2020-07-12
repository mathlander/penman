import { authConstants, offlineConstants, defaultDate } from '../../constants';
import { storageRecordTypes } from '../types/storageTypes';
import { errorCodes, nullError, apiUnreachable } from '../types/errorTypes';
import { defaultAuthenticationState } from '../types/authTypes';

const generateManagedAuthReducer = (storageManager) => {
    const initState = storageManager.readStateFromLocalStorage(storageRecordTypes.authentication);
    let lastAuthenticatedUserId = initState.authenticatedUser.profile.userId;
    return (state = initState, action) => {
        let nextState = state;
        switch (action.type) {
            case authConstants.AUTH_CLEAR_ERROR:
                nextState = {
                    ...state,
                    authErrorState: nullError,
                };
                return nextState;
            case authConstants.CANCEL_AUTH_ACTION:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;

            case authConstants.LOGIN:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions.concat([action]),
                };
                return nextState;
            case authConstants.LOGIN_SUCCESS:
                const authenticatedUser = action.payload;
                // handle the edge case: authToken expires => refreshToken expires or password updated => different user logs in (protect original user data)
                // while still allowing: authToken expires => refreshToken expires or password updated => original user logs in (protect offline work)
                if (lastAuthenticatedUserId && lastAuthenticatedUserId !== authenticatedUser.profile.userId) {
                    storageManager.clear();
                    localStorage.clear();
                }
                lastAuthenticatedUserId = authenticatedUser.profile.userId;
                nextState = {
                    ...state,
                    authenticatedUser: authenticatedUser,
                    authErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                storageManager.track(storageRecordTypes.authentication, authenticatedUser);
                storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;
            case authConstants.LOGIN_ERROR:
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to authenticate the user.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to authenticate the user.`,
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                return nextState;

            case authConstants.LOGOUT:
                // remove all cached items from all states/reducers on logout
                storageManager.clear();
                localStorage.clear();
                return defaultAuthenticationState;

            case authConstants.REFRESH_TOKEN:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.REFRESH_TOKEN)
                        .concat([action]),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp !== action.timestamp && queuedAction.type !== authConstants.REFRESH_TOKEN),
                };
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;
            case authConstants.REFRESH_TOKEN_SUCCESS:
                const refreshedUser = action.payload;
                if (lastAuthenticatedUserId && lastAuthenticatedUserId !== refreshedUser.profile.userId) {
                    storageManager.clear();
                    localStorage.clear();
                }
                lastAuthenticatedUserId = refreshedUser.profile.userId;
                nextState = {
                    ...state,
                    authenticatedUser: refreshedUser,
                    authErrorState: nullError,
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.REFRESH_TOKEN),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp && queuedAction.type !== authConstants.REFRESH_TOKEN),
                };
                storageManager.track(storageRecordTypes.authentication, refreshedUser);
                storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;
            case authConstants.REFRESH_TOKEN_ERROR:
                // update the expiration dates and allow the isTokenExpired() method to indicate that the user should be redirected to login
                // but preserve all of the offline data, in case the user updated their password or just hasn't used the app in a while
                if (action.error.errorCode === errorCodes.invalidRefreshToken || action.error.errorCode === errorCodes.refreshTokenExpired) {
                    state.authenticatedUser.tokenExpirationDate = defaultDate;
                    state.authenticatedUser.refreshTokenExpirationDate = defaultDate;
                }
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to authenticate the user.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to authenticate the user.`,
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;
            case authConstants.REFRESH_TOKEN_TIMEOUT:
                // if more than one refresh token is queued, keep only the most recent
                nextState = {
                    ...state,
                    authErrorState: action.suppressTimeoutAlert
                        ? state.authErrorState
                        : action.error || apiUnreachable,
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.REFRESH_TOKEN),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.type !== authConstants.REFRESH_TOKEN)
                        .concat([action.memento]),
                };
                storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;

            case authConstants.UPDATE_USER_PROFILE:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.UPDATE_USER_PROFILE)
                        .concat([action]),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp !== action.timestamp && queuedAction.type !== authConstants.UPDATE_USER_PROFILE),
                };
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;
            case authConstants.UPDATE_USER_PROFILE_SUCCESS:
                const updatedUser = action.payload;
                nextState = {
                    ...state,
                    authenticatedUser: updatedUser,
                    authErrorState: nullError,
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.UPDATE_USER_PROFILE),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp && queuedAction.type !== authConstants.UPDATE_USER_PROFILE),
                };
                storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;
            case authConstants.UPDATE_USER_PROFILE_ERROR:
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to update the user's profile.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to update the user's profile.`,
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                return nextState;
            case authConstants.UPDATE_USER_PROFILE_TIMEOUT:
                // if more than one refresh token is queued, keep only the most recent
                nextState = {
                    ...state,
                    authErrorState: action.suppressTimeoutAlert
                        ? state.authErrorState
                        : Object.assign({
                            displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                            internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                            errorCode: errorCodes.apiUnreachable,
                        }),
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.UPDATE_USER_PROFILE),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.type !== authConstants.UPDATE_USER_PROFILE)
                        .concat([action.memento]),
                };
                storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;

            case authConstants.UPDATE_USER_PASSWORD:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions.concat([action]),
                };
                return nextState;
            case authConstants.UPDATE_USER_PASSWORD_SUCCESS:
                const newPasswordUser = action.payload;
                // handle the edge case: authToken expires => refreshToken expires or password updated => different user logs in (protect original user data)
                // while still allowing: authToken expires => refreshToken expires or password updated => original user logs in (protect offline work)
                if (lastAuthenticatedUserId && lastAuthenticatedUserId !== newPasswordUser.profile.userId) {
                    storageManager.clear();
                    localStorage.clear();
                }
                lastAuthenticatedUserId = newPasswordUser.profile.userId;
                nextState = {
                    ...state,
                    authenticatedUser: newPasswordUser,
                    authErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                storageManager.track(storageRecordTypes.authentication, newPasswordUser);
                storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;
            case authConstants.UPDATE_USER_PASSWORD_TIMEOUT:
            case authConstants.UPDATE_USER_PASSWORD_ERROR:
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to the user's password.  Please try again.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to update the user's password.`,
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                return nextState;

            case authConstants.CREATE_NEW_USER:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions.concat([action]),
                };
                return nextState;
            case authConstants.CREATE_NEW_USER_SUCCESS:
                const createdUser = action.payload;
                nextState = {
                    ...state,
                    authenticatedUser: createdUser,
                    authErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                storageManager.track(storageRecordTypes.authentication, createdUser);
                storageManager.writeStateToLocalStorage(storageRecordTypes.authentication, nextState);
                return nextState;
            case authConstants.CREATE_NEW_USER_TIMEOUT:
            case authConstants.CREATE_NEW_USER_ERROR:
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to create a new user.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to create a new user.`,
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                return nextState;

            case authConstants.DEACTIVATE_USER_ACCOUNT:
            case authConstants.DEACTIVATE_USER_ACCOUNT_SUCCESS:
            case authConstants.DEACTIVATE_USER_ACCOUNT_ERROR:
            case authConstants.DEACTIVATE_USER_ACCOUNT_TIMEOUT:
            default:
                return nextState;
        }
    };
};

export default generateManagedAuthReducer;
