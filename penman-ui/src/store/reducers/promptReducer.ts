import { promptConstants } from '../../config/constants';
import { IPrompt, IPromptCollection, IPromptState, IPromptErrorState, IPromptReducerAction } from '../types';

const nullErrorState: IPromptErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IPromptState => {
    let localStorageState: IPromptState = JSON.parse(localStorage.getItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY) || 'null') || {
        prompts: {},
        promptErrorState: nullErrorState,
        pendingActions: [],
    };
    Object.values(localStorageState.prompts).forEach((prompt) => {
        prompt.createdDate = new Date(prompt.createdDate);
        prompt.modifiedDate = new Date(prompt.modifiedDate);
    });
    return localStorageState;
};

const updateLocalStorage = (state: IPromptState) : void => {
    localStorage.setItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY, JSON.stringify({
        prompts: state.prompts,
        promptErrorState: nullErrorState,
        pendingActions: state.pendingActions,
    }));
};

const initState: IPromptState = readLocalStorage();

const promptReducer = (state: IPromptState = initState, action: IPromptReducerAction): IPromptState => {
    let nextState = initState;
    switch (action.type) {
        case promptConstants.CREATE_NEW_PROMPT:
            const pendingNewPrompt: IPrompt = action.payload;
            nextState = {
                ...state,
                prompts: {
                    ...state.prompts,
                    [-action.timestamp]: pendingNewPrompt,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.CREATE_NEW_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new prompt to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified prompt definition.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.CREATE_NEW_PROMPT_SUCCESS:
            // consider persisting IPrompt objects in localStorage, they're light and rare (per author)
            const newPrompt: IPrompt = action.payload;
            nextState = {
                ...state,
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

        case promptConstants.DELETE_PROMPT:
            const deletedPrompt: IPrompt = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
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
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
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

        case promptConstants.READ_ALL_PROMPTS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_ALL_PROMPTS_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all prompts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the prompt collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_ALL_PROMPTS_SUCCESS:
            const promptCollection: IPromptCollection = action.payload;
            nextState = {
                ...state,
                prompts: {
                    ...state.prompts
                },
                promptErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            promptCollection.prompts.forEach(prompt => {
                nextState.prompts[prompt.promptId] = prompt;
            });
            updateLocalStorage(nextState);
            return nextState;

        case promptConstants.READ_PROMPT:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all prompts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the prompt collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.READ_PROMPT_SUCCESS:
            const retrievedPrompt: IPrompt = action.payload;
            nextState = {
                ...state,
                prompts: {
                    ...state.prompts,
                    [retrievedPrompt.promptId]: retrievedPrompt,
                },
                promptErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case promptConstants.UPDATE_PROMPT:
            const pendingUpdatedPrompt: IPrompt = action.payload;
            nextState = {
                ...state,
                prompts: {
                    ...state.prompts,
                    [pendingUpdatedPrompt.promptId]: pendingUpdatedPrompt,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.UPDATE_PROMPT_ERROR:
            nextState = {
                ...state,
                promptErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all prompts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the prompt collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case promptConstants.UPDATE_PROMPT_SUCCESS:
            const updatedPrompt: IPrompt = action.payload;
            nextState = {
                ...state,
                prompts: {
                    ...state.prompts,
                    [updatedPrompt.promptId]: updatedPrompt,
                },
                promptErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
}

export default promptReducer;
