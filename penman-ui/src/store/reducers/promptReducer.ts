import { promptConstants, offlineConstants } from '../../constants';
// import { StorageRecordType, IStorageManager } from '../type-defs/storage-types';
// import { ErrorCodes, nullError, apiUnreachable } from '../type-defs/error-types';
import { IPenmanAction } from '../type-defs/action-types';
import { Prompt, IPromptState, defaultPromptState } from '../type-defs/prompt-types';
import { PromptActionMemento } from '../actions/promptActions';
import { UUID } from '../../utilities';

enum ErrorCodes {
    none = 0,

    // server
    unknown = 1000,
    clientIdCollided = 1001,
    unauthorziedAction = 1002,
    authenticationFailed = 1003,
    accountDeleted = 1004,
    accountLocked = 1005,
    refreshTokenExpired = 1006,
    invalidRefreshToken = 1007,

    // client
    apiUnreachable = 2000,
    dependencyNoLongerExists = 2001,
};

interface IError {
    errorCode: ErrorCodes,
    internalErrorMessage: string;
    displayErrorMessage: string;
};

const nullError: IError = {
    errorCode: ErrorCodes.none,
    internalErrorMessage: '',
    displayErrorMessage: '',
};

const apiUnreachable: IError = {
    errorCode: ErrorCodes.apiUnreachable,
    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
};

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

const generateManagedPromptReducer = (storageManager: IStorageManager) => {
    const initState: IPromptState = storageManager.readStateFromLocalStorage(StorageRecordType.prompt);
    return (state: IPromptState = initState, action: IPenmanAction): IPromptState => {
        let nextState = state;
        switch (action.type) {
            case promptConstants.PROMPT_CLEAR_ERROR:
                nextState = {
                    ...state,
                    promptErrorState: nullError,
                };
                return nextState;
            case promptConstants.CANCEL_PROMPT_ACTION:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;

            case promptConstants.CREATE_NEW_PROMPT:
                const pendingNewPrompt: Prompt = action.payload;
                nextState = {
                    ...state,
                    uuidLookup: {
                        ...state.uuidLookup,
                        [pendingNewPrompt.clientId]: pendingNewPrompt,
                    },
                    prompts: {
                        ...state.prompts,
                        [-action.timestamp]: pendingNewPrompt,
                    },
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp)
                        .concat([action]),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                storageManager.track(StorageRecordType.prompt, pendingNewPrompt);
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.CREATE_NEW_PROMPT_ERROR:
                const failedNewPrompt: Prompt = action.payload;
                nextState = {
                    ...state,
                    promptErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to create the specified prompt definition.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to submit the new prompt to the API.`,
                        errorCode: ErrorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                delete nextState.prompts[-action.timestamp];
                delete nextState.uuidLookup[failedNewPrompt.clientId];
                failedNewPrompt.isDeleted = true;
                storageManager.publish(StorageRecordType.prompt, failedNewPrompt.clientIdHistory, failedNewPrompt);
                storageManager.untrack(StorageRecordType.prompt, failedNewPrompt.clientId);
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.CREATE_NEW_PROMPT_SUCCESS:
                const newPrompt: Prompt = action.payload;
                nextState = {
                    ...state,
                    prompts: {
                        ...state.prompts,
                        [newPrompt.promptId]: newPrompt,
                    },
                    promptErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                delete nextState.prompts[-action.timestamp];
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.CREATE_NEW_PROMPT_TIMEOUT:
                nextState = {
                    ...state,
                    promptErrorState: action.suppressTimeoutAlert
                        ? state.promptErrorState
                        : action.error || apiUnreachable,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp !== action.timestamp)
                        .concat([action.memento]),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;

            case promptConstants.UPDATE_PROMPT:
                const pendingUpdatedPrompt: Prompt = action.payload;
                nextState = {
                    ...state,
                    uuidLookup: {
                        ...state.uuidLookup,
                        [pendingUpdatedPrompt.clientId]: pendingUpdatedPrompt,
                    },
                    prompts: {
                        ...state.prompts,
                        [pendingUpdatedPrompt.promptId]: pendingUpdatedPrompt,
                    },
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp)
                        .concat([action]),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.UPDATE_PROMPT_ERROR:
                nextState = {
                    ...state,
                    promptErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to update the specified prompt.`,
                        internalErrorMessage: `The API returned an error while attempting to update the specified prompt.`,
                        errorCode: ErrorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                return nextState;
            case promptConstants.UPDATE_PROMPT_SUCCESS:
                const updatedPrompt: Prompt = action.payload;
                nextState = {
                    ...state,
                    uuidLookup: {
                        ...state.uuidLookup,
                        [updatedPrompt.clientId]: updatedPrompt,
                    },
                    prompts: {
                        ...state.prompts,
                        [updatedPrompt.promptId]: updatedPrompt,
                    },
                    promptErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.UPDATE_PROMPT_TIMEOUT:
                nextState = {
                    ...state,
                    promptErrorState: action.suppressTimeoutAlert
                        ? state.promptErrorState
                        : action.error || apiUnreachable,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                const bundleUpdateWithQueuedAction = nextState.offlineActionQueue
                    .filter(queuedAction =>
                            queuedAction.timestamp < action.timestamp
                            && (queuedAction as PromptActionMemento).prompt.clientId === action.payload.clientId
                            && (queuedAction.type === promptConstants.CREATE_NEW_PROMPT || queuedAction.type === promptConstants.UPDATE_PROMPT))
                    .length > 0;
                if (!bundleUpdateWithQueuedAction) nextState.offlineActionQueue.push(action.memento);
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;

            case promptConstants.DELETE_PROMPT:
                const deletedPrompt: Prompt = action.payload;
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                // if the item was never recorded on the server, then any offline actions against this item
                // can be canceled and any dependent objects/references nullified
                const isServerResponseIrrelevant = nextState.offlineActionQueue
                    .filter(queuedAction =>
                            queuedAction.timestamp < action.timestamp
                            && (queuedAction as PromptActionMemento).prompt.clientId === action.payload.clientId
                            && queuedAction.type === promptConstants.CREATE_NEW_PROMPT)
                    .length > 0;
                deletedPrompt.isDeleted = true;
                storageManager.publish(StorageRecordType.prompt, deletedPrompt.clientIdHistory, deletedPrompt);
                if (isServerResponseIrrelevant) {
                    nextState.offlineActionQueue = nextState.offlineActionQueue
                        .filter(queuedAction => (queuedAction as PromptActionMemento).prompt.clientId !== action.payload.clientId);
                    storageManager.untrack(StorageRecordType.prompt, deletedPrompt.clientId);
                }
                nextState.pendingActions.push(action.memento);
                delete nextState.uuidLookup[deletedPrompt.clientId];
                delete nextState.prompts[deletedPrompt.promptId];
                delete nextState.prompts[-action.timestamp];
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, deletedPrompt);
                return nextState;
            case promptConstants.DELETE_PROMPT_ERROR:
                nextState = {
                    ...state,
                    promptErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to delete this prompt.`,
                        internalErrorMessage: `The API returned an error while attempting to delete the prompt.`,
                        errorCode: ErrorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                nextState.offlineActionQueue = nextState.offlineActionQueue
                    .filter(queuedAction => (queuedAction as PromptActionMemento).prompt.clientId !== action.payload.clientId);
                storageManager.untrack(StorageRecordType.prompt, (action.payload as Prompt).clientId);
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.DELETE_PROMPT_SUCCESS:
                nextState = {
                    ...state,
                    promptErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                nextState.offlineActionQueue = nextState.offlineActionQueue
                    .filter(queuedAction => (queuedAction as PromptActionMemento).prompt.clientId !== action.payload.clientId);
                storageManager.untrack(StorageRecordType.prompt, (action.payload as Prompt).clientId);
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.DELETE_PROMPT_TIMEOUT:
                nextState = {
                    ...state,
                    promptErrorState: action.suppressTimeoutAlert
                        ? state.promptErrorState
                        : action.error || apiUnreachable,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp !== action.timestamp)
                        .concat([action.memento]),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;

            case promptConstants.READ_PROMPT:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp)
                        .concat([action]),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                return nextState;
            case promptConstants.READ_PROMPT_ERROR:
                nextState = {
                    ...state,
                    promptErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to retrieve the specified prompt.`,
                        internalErrorMessage: `The API returned an error while attempting to read the specified prompt.`,
                        errorCode: ErrorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                return nextState;
            case promptConstants.READ_PROMPT_SUCCESS:
                const retrievedPrompt: Prompt = action.payload;
                nextState = {
                    ...state,
                    uuidLookup: {
                        ...state.uuidLookup,
                        [retrievedPrompt.clientId]: retrievedPrompt,
                    },
                    prompts: {
                        ...state.prompts,
                        [retrievedPrompt.promptId]: retrievedPrompt,
                    },
                    promptErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                storageManager.track(StorageRecordType.prompt, retrievedPrompt.clientId);
                storageManager.publish(StorageRecordType.prompt, retrievedPrompt.clientIdHistory, retrievedPrompt);
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.READ_PROMPT_TIMEOUT:
                nextState = {
                    ...state,
                    promptErrorState: action.suppressTimeoutAlert
                        ? state.promptErrorState
                        : action.error || apiUnreachable,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp !== action.timestamp)
                        .concat([action.memento]),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;

            case promptConstants.READ_ALL_PROMPTS:
                nextState = {
                    ...state,
                    pendingActions: state.pendingActions
                        .filter(pendingAction => pendingAction.timestamp !== action.timestamp)
                        .concat([action]),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                return nextState;
            case promptConstants.READ_ALL_PROMPTS_ERROR:
                nextState = {
                    ...state,
                    promptErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to retrieve the specified prompt collection.`,
                        internalErrorMessage: `The API returned an error while attempting to read all prompts for the given author.`,
                        errorCode: ErrorCodes.unknown,
                    }, action.error),
                };
                return nextState;
            case promptConstants.READ_ALL_PROMPTS_SUCCESS:
                nextState = {
                    ...state,
                    promptErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
                };
                if (action.payload.authenticatedUserId === action.payload.targetUserId) nextState.lastReadAllDate = action.payload.lastReadAllDate;
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;
            case promptConstants.READ_ALL_PROMPTS_TIMEOUT:
                nextState = {
                    ...state,
                    promptErrorState: action.suppressTimeoutAlert
                        ? state.promptErrorState
                        : action.error || apiUnreachable,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                    offlineActionQueue: state.offlineActionQueue
                        .filter(queuedAction => queuedAction.timestamp !== action.timestamp)
                        .concat([action.memento]),
                };
                storageManager.writeStateToLocalStorage(StorageRecordType.prompt, nextState);
                return nextState;

            default:
                return nextState;
        }
    };
};

export default generateManagedPromptReducer;
