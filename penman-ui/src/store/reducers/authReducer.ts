import { authConstants, offlineConstants, defaultDate } from '../../constants';
// import { StorageRecordType, IStorageManager } from '../type-defs/storage-types';
import { ErrorCodes, nullError, apiUnreachable } from '../type-defs/error-types';
import { IPenmanAction } from '../type-defs/action-types';
import { AuthenticatedUser, IAuthenticationState, defaultAuthenticationState } from '../type-defs/auth-types';
import { UUID } from '../../utilities';

enum PersistenceTypes {
    // never store
    forget = 0,
    // id, clientId, overlay
    feather = 1,
    // id, clientId, overlay, title, (possibly) summary
    light = 2,
    // everything
    heavy = 3,
};

interface IPrioritizable {
    readonly weightHeavy: number;
    readonly weightLight: number;
    readonly lastReadAccessTime: number;
    readonly lastWriteAccessTime: number;
    readonly isPartial: boolean;
};

enum StorageRecordType {
    authentication = 0,
    user = 1,
    prompt = 2,
};

interface IStorageRecord {
    clientId: UUID;
    storageRecordType: StorageRecordType;
    persistenceLevel: PersistenceTypes;
    item: IPrioritizable;
    heapNodeId: number;
    heapIndex(): number;
};

interface IStorageManager {
    readAccessed(storageRecordType: StorageRecordType, clientId: UUID): void;
    writeAccessed(storageRecordType: StorageRecordType, clientId: UUID): void;

    readStateFromLocalStorage(storageRecordType: StorageRecordType): any;
    writeStateToLocalStorage(storageRecordType: StorageRecordType, state: any): void;

    track(storageRecordType: StorageRecordType, item: any): void;
    untrack(storageRecordType: StorageRecordType, clientId: UUID): void;

    subscribe(targetStorageRecordType: StorageRecordType, targetClientId: UUID, subscriberClientId: UUID, callback: (item: any) => void): void;
    unsubscribe(targetStorageRecordType: StorageRecordType, targetClientId: UUID, subscriberClientId: UUID): void;
    publish(targetStorageRecordType: StorageRecordType, clientIdHistory: UUID[], item: any): void;

    clear(): void;
};

const generateManagedAuthReducer = (storageManager: IStorageManager) => {
    const initState: IAuthenticationState = storageManager.readStateFromLocalStorage(StorageRecordType.authentication);
    let lastAuthenticatedUserId = initState.authenticatedUser.profile.userId;
    return (state: IAuthenticationState = initState, action: IPenmanAction): IAuthenticationState => {
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
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;

            case authConstants.LOGIN:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions.concat([action]),
                };
                return nextState;
            case authConstants.LOGIN_SUCCESS:
                const authenticatedUser: AuthenticatedUser = action.payload;
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
                storageManager.track(StorageRecordType.authentication, authenticatedUser);
                storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;
            case authConstants.LOGIN_ERROR:
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to authenticate the user.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to authenticate the user.`,
                        errorCode: ErrorCodes.unknown,
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
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;
            case authConstants.REFRESH_TOKEN_SUCCESS:
                const refreshedUser: AuthenticatedUser = action.payload;
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
                storageManager.track(StorageRecordType.authentication, refreshedUser);
                storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;
            case authConstants.REFRESH_TOKEN_ERROR:
                // update the expiration dates and allow the isTokenExpired() method to indicate that the user should be redirected to login
                // but preserve all of the offline data, in case the user updated their password or just hasn't used the app in a while
                if (action.error.errorCode === ErrorCodes.invalidRefreshToken || action.error.errorCode === ErrorCodes.refreshTokenExpired) {
                    state.authenticatedUser.tokenExpirationDate = defaultDate;
                    state.authenticatedUser.refreshTokenExpirationDate = defaultDate;
                }
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to authenticate the user.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to authenticate the user.`,
                        errorCode: ErrorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
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
                storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
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
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;
            case authConstants.UPDATE_USER_PROFILE_SUCCESS:
                const updatedUser: AuthenticatedUser = action.payload;
                nextState = {
                    ...state,
                    authenticatedUser: updatedUser,
                    authErrorState: nullError,
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.UPDATE_USER_PROFILE),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp && queuedAction.type !== authConstants.UPDATE_USER_PROFILE),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;
            case authConstants.UPDATE_USER_PROFILE_ERROR:
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to update the user's profile.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to update the user's profile.`,
                        errorCode: ErrorCodes.unknown,
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
                            errorCode: ErrorCodes.apiUnreachable,
                        }),
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp && pendingAction.type !== authConstants.UPDATE_USER_PROFILE),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.type !== authConstants.UPDATE_USER_PROFILE)
                        .concat([action.memento]),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;

            case authConstants.UPDATE_USER_PASSWORD:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions.concat([action]),
                };
                return nextState;
            case authConstants.UPDATE_USER_PASSWORD_SUCCESS:
                const newPasswordUser: AuthenticatedUser = action.payload;
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
                storageManager.track(StorageRecordType.authentication, newPasswordUser);
                storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;
            case authConstants.UPDATE_USER_PASSWORD_TIMEOUT:
            case authConstants.UPDATE_USER_PASSWORD_ERROR:
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to the user's password.  Please try again.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to update the user's password.`,
                        errorCode: ErrorCodes.unknown,
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
                const createdUser: AuthenticatedUser = action.payload;
                nextState = {
                    ...state,
                    authenticatedUser: createdUser,
                    authErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                storageManager.track(StorageRecordType.authentication, createdUser);
                storageManager.writeStateToLocalStorage(StorageRecordType.authentication, nextState);
                return nextState;
            case authConstants.CREATE_NEW_USER_TIMEOUT:
            case authConstants.CREATE_NEW_USER_ERROR:
                nextState = {
                    ...state,
                    authErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to create a new user.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to create a new user.`,
                        errorCode: ErrorCodes.unknown,
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
