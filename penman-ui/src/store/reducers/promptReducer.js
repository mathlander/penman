import { promptConstants } from '../../constants';
import { errorCodes, nullError, apiUnreachable } from '../types/errorTypes';
import { storageRecordTypes } from '../types/storageTypes';

const generateManagedPromptReducer = (storageManager) => {
    const initState = storageManager.readStateFromLocalStorage(storageRecordTypes.prompt);
    return (state = initState, action) => {
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
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
                return nextState;

            case promptConstants.CREATE_NEW_PROMPT:
                const pendingNewPrompt = action.payload;
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
                storageManager.track(storageRecordTypes.prompt, pendingNewPrompt);
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
                return nextState;
            case promptConstants.CREATE_NEW_PROMPT_ERROR:
                const failedNewPrompt = action.payload;
                nextState = {
                    ...state,
                    promptErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to create the specified prompt definition.`,
                        internalErrorMessage: `An unidentified error occurred while attempting to submit the new prompt to the API.`,
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                delete nextState.prompts[-action.timestamp];
                delete nextState.uuidLookup[failedNewPrompt.clientId];
                failedNewPrompt.isDeleted = true;
                storageManager.publish(storageRecordTypes.prompt, failedNewPrompt.clientIdHistory, failedNewPrompt);
                storageManager.untrack(storageRecordTypes.prompt, failedNewPrompt.clientId);
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
                return nextState;
            case promptConstants.CREATE_NEW_PROMPT_SUCCESS:
                const newPrompt = action.payload;
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
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
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
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
                return nextState;

            case promptConstants.UPDATE_PROMPT:
                const pendingUpdatedPrompt = action.payload;
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
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
                return nextState;
            case promptConstants.UPDATE_PROMPT_ERROR:
                nextState = {
                    ...state,
                    promptErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to update the specified prompt.`,
                        internalErrorMessage: `The API returned an error while attempting to update the specified prompt.`,
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                return nextState;
            case promptConstants.UPDATE_PROMPT_SUCCESS:
                const updatedPrompt = action.payload;
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
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
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
                            && queuedAction.prompt.clientId === action.payload.clientId
                            && (queuedAction.type === promptConstants.CREATE_NEW_PROMPT || queuedAction.type === promptConstants.UPDATE_PROMPT))
                    .length > 0;
                if (!bundleUpdateWithQueuedAction) nextState.offlineActionQueue.push(action.memento);
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
                return nextState;

            case promptConstants.DELETE_PROMPT:
                const deletedPrompt = action.payload;
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
                            && queuedAction.prompt.clientId === action.payload.clientId
                            && queuedAction.type === promptConstants.CREATE_NEW_PROMPT)
                    .length > 0;
                deletedPrompt.isDeleted = true;
                storageManager.publish(storageRecordTypes.prompt, deletedPrompt.clientIdHistory, deletedPrompt);
                if (isServerResponseIrrelevant) {
                    nextState.offlineActionQueue = nextState.offlineActionQueue
                        .filter(queuedAction => queuedAction.prompt.clientId !== action.payload.clientId);
                    storageManager.untrack(storageRecordTypes.prompt, deletedPrompt.clientId);
                }
                nextState.pendingActions.push(action.memento);
                delete nextState.uuidLookup[deletedPrompt.clientId];
                delete nextState.prompts[deletedPrompt.promptId];
                delete nextState.prompts[-action.timestamp];
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, deletedPrompt);
                return nextState;
            case promptConstants.DELETE_PROMPT_ERROR:
                nextState = {
                    ...state,
                    promptErrorState: Object.assign({
                        displayErrorMessage: `An error occurred while attempting to delete this prompt.`,
                        internalErrorMessage: `The API returned an error while attempting to delete the prompt.`,
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                nextState.offlineActionQueue = nextState.offlineActionQueue
                    .filter(queuedAction => queuedAction.prompt.clientId !== action.payload.clientId);
                storageManager.untrack(storageRecordTypes.prompt, action.payload.clientId);
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
                return nextState;
            case promptConstants.DELETE_PROMPT_SUCCESS:
                nextState = {
                    ...state,
                    promptErrorState: nullError,
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                nextState.offlineActionQueue = nextState.offlineActionQueue
                    .filter(queuedAction => queuedAction.prompt.clientId !== action.payload.clientId);
                storageManager.untrack(storageRecordTypes.prompt, action.payload.clientId);
                if (nextState.offlineActionQueue.length !== state.offlineActionQueue.length) storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
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
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
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
                        errorCode: errorCodes.unknown,
                    }, action.error),
                    pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                };
                return nextState;
            case promptConstants.READ_PROMPT_SUCCESS:
                const retrievedPrompt = action.payload;
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
                storageManager.track(storageRecordTypes.prompt, retrievedPrompt.clientId);
                storageManager.publish(storageRecordTypes.prompt, retrievedPrompt.clientIdHistory, retrievedPrompt);
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
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
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
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
                        errorCode: errorCodes.unknown,
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
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
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
                storageManager.writeStateToLocalStorage(storageRecordTypes.prompt, nextState);
                return nextState;

            default:
                return nextState;
        }
    };
};

export default generateManagedPromptReducer;
