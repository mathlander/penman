import { defaultDate, promptConstants, offlineConstants } from '../../config/constants';
import { Prompt, UUID, IPromptState, IPromptErrorState, IPromptReducerAction, restoreOfflineWorkItemFromJSON } from '../types';
import { PromptActionMemento } from '../actions/promptActions';

const nullErrorState: IPromptErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IPromptState => {
    let clientIdLookup: Record<UUID, Prompt> = {};
    let localStorageState: IPromptState = JSON.parse(localStorage.getItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY) || 'null', (key, value) => {
        if (key === 'pendingActions' || key === 'offlineActionQueue') {
            return value.map((memento: string) => PromptActionMemento.hydrate(memento));
        } else if (key === 'prompts') {
            const promptRecords: Record<number, Prompt> = value.reduce((map: Record<number, Prompt>, serializedObj: string) => {
                const prompt = restoreOfflineWorkItemFromJSON<Prompt>(serializedObj, Prompt);
                clientIdLookup[prompt.clientId] = prompt;
                return map[prompt.promptId] = prompt;
            }, {});
            return promptRecords;
        } else if (key === '') {
            value.clientIdLookup = clientIdLookup;
        } else return value;
    }) || {
        clientIdLookup: {},
        prompts: {},
        promptErrorState: nullErrorState,
        pendingActions: [],
        offlineActionQueue: [],
        lastReadAll: defaultDate,
    };
    localStorageState.lastReadAll = (localStorageState.lastReadAll && new Date(localStorageState.lastReadAll)) || defaultDate;
    return localStorageState;
};

const updateLocalStorage = (state: IPromptState) : void => {
    localStorage.setItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY, JSON.stringify({
        prompts: Object.values(state.prompts).map(prompt => prompt.toSerializedJSON()),
        promptErrorState: nullErrorState,
        pendingActions: state.pendingActions.map(actionMemento => actionMemento.serializedData),
        offlineActionQueue: state.offlineActionQueue.map(actionMemento => actionMemento.serializedData),
        lastReadAll: (state.lastReadAll && state.lastReadAll.toISOString()) || defaultDate.toISOString(),
    }));
};

const initState: IPromptState = readLocalStorage();

const promptReducer = (state: IPromptState = initState, action: IPromptReducerAction): IPromptState => {
    let nextState = initState;
    switch (action.type) {
        case promptConstants.PROMPT_CLEAR_ERROR:
            nextState = {
                ...state,
                promptErrorState: nullErrorState,
            };
            updateLocalStorage(nextState);
            return nextState;

        case promptConstants.CREATE_NEW_PROMPT:
            const pendingNewPrompt: Prompt = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingNewPrompt.clientId]: pendingNewPrompt,
                },
                prompts: {
                    ...state.prompts,
                    [-action.timestamp]: pendingNewPrompt,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.CREATE_NEW_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new prompt to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified prompt definition.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.CREATE_NEW_PROMPT_SUCCESS:
            // consider persisting IPrompt objects in localStorage, they're light and rare (per author)
            const newPrompt: Prompt = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [newPrompt.clientId]: newPrompt,
                },
                prompts: {
                    ...state.prompts,
                    [newPrompt.promptId]: newPrompt,
                },
                promptErrorState: nullErrorState,
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
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
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
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            delete nextState.clientIdLookup[deletedPrompt.clientId];
            delete nextState.prompts[deletedPrompt.promptId];
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.DELETE_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to delete the prompt.',
                    displayErrorMessage: 'An error occurred while attempting to delete this prompt.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.DELETE_PROMPT_SUCCESS:
            nextState = {
                ...state,
                promptErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.DELETE_PROMPT_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case promptConstants.READ_ALL_PROMPTS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_ALL_PROMPTS_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all prompts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the prompt collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_ALL_PROMPTS_SUCCESS:
            const promptCollection: Prompt[] = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                },
                prompts: {
                    ...state.prompts
                },
                promptErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                lastReadAll: new Date(action.timestamp),
            };
            promptCollection.forEach(prompt => {
                nextState.clientIdLookup[prompt.clientId] = prompt;
                nextState.prompts[prompt.promptId] = prompt;
            });
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_ALL_PROMPTS_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case promptConstants.READ_PROMPT:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all prompts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the prompt collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_PROMPT_SUCCESS:
            const retrievedPrompt: Prompt = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [retrievedPrompt.clientId]: retrievedPrompt,
                },
                prompts: {
                    ...state.prompts,
                    [retrievedPrompt.promptId]: retrievedPrompt,
                },
                promptErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_PROMPT_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
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
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingUpdatedPrompt.clientId]: pendingUpdatedPrompt,
                },
                prompts: {
                    ...state.prompts,
                    [pendingUpdatedPrompt.promptId]: pendingUpdatedPrompt,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.UPDATE_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all prompts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the prompt collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.UPDATE_PROMPT_SUCCESS:
            const updatedPrompt: Prompt = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [updatedPrompt.clientId]: updatedPrompt,
                },
                prompts: {
                    ...state.prompts,
                    [updatedPrompt.promptId]: updatedPrompt,
                },
                promptErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.UPDATE_PROMPT_TIMEOUT:
            nextState = {
                ...state,
                promptErrorState: action.suppressTimeoutAlert
                    ? state.promptErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
}

export default promptReducer;
