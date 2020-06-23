import { promptConstants } from '../../constants';
import { Prompt, IPromptState, IPromptAction, nullError, apiUnreachableError, defaultPromptState, UUID } from '../types';
import { PromptActionMemento } from '../actions/promptActions';
import { deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { ErrorCodes } from '../type-defs/error-types';

const readLocalStorage = (): IPromptState => {
    let fromStorage = localStorage.getItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Prompt> = {};
    return Object.assign(
        {},
        defaultPromptState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => PromptActionMemento.hydrate(memento));
            } else if (key === 'prompts') {
                const promptRecords: Record<number, Prompt> = value.reduce((map: Record<number, Prompt>, serializedObject: string) => {
                    const prompt = Prompt.fromSerializedJSON(serializedObject);
                    uuidLookup[prompt.clientId] = prompt;
                    map[prompt.promptId] = prompt;
                    return map;
                }, {});
                return promptRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.promptErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IPromptState): void => {
    localStorage.setItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        prompts: Object.values(state.prompts).map(prompt => prompt.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};

const initState: IPromptState = readLocalStorage();

const promptReducer = (state: IPromptState = initState, action: IPromptAction): IPromptState => {
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
            updateLocalStorage(nextState);
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
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.CREATE_NEW_PROMPT_ERROR:
            const failedNewPrompt: Prompt = action.payload;
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to create the specified prompt definition.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new prompt to the API.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.prompts[-action.timestamp];
            delete nextState.uuidLookup[failedNewPrompt.clientId];
            updateLocalStorage(nextState);
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
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.CREATE_NEW_PROMPT_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
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
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.UPDATE_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to update the specified prompt.',
                    internalErrorMessage: 'The API returned an error while attempting to update the specified prompt.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
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
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.UPDATE_PROMPT_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case promptConstants.DELETE_PROMPT:
            const deletedPrompt: Prompt = action.payload;
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            delete nextState.uuidLookup[deletedPrompt.clientId];
            delete nextState.prompts[deletedPrompt.promptId];
            delete nextState.prompts[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.DELETE_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to delete this prompt.',
                    internalErrorMessage: 'The API returned an error while attempting to delete the prompt.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case promptConstants.DELETE_PROMPT_SUCCESS:
            nextState = {
                ...state,
                promptErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case promptConstants.DELETE_PROMPT_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case promptConstants.READ_PROMPT:
            // const readingPrompt: Prompt = action.payload;
            nextState = {
                ...state,
                // prompts: {
                //     ...state.prompts,
                //     [readingPrompt.promptId]: readingPrompt,
                // },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified prompt',
                    internalErrorMessage: 'The API returned an error while attempting to read the specified prompt.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
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
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_PROMPT_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case promptConstants.READ_ALL_PROMPTS:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_ALL_PROMPTS_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified prompt collection.',
                    internalErrorMessage: 'The API returned an error while attempting to read all prompts for the given author.',
                    errorCode: ErrorCodes.apiUnreachable,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_ALL_PROMPTS_SUCCESS:
            // may want to create another lookup by userId (action.payload.targetUserId)
            nextState = {
                ...state,
                promptErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.payload.authenticatedUserId === action.payload.targetUserId) nextState.lastReadAll = action.payload.lastReadAll;
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_ALL_PROMPTS_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
};

export default promptReducer;
