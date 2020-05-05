import { personificationConstants } from '../../config/constants';
import { IPersonification, IPersonificationCollection, IPersonificationState, IPersonificationErrorState, IPersonificationReducerAction } from '../types';

const nullErrorState: IPersonificationErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IPersonificationState => {
    let localStorageState: IPersonificationState = JSON.parse(localStorage.getItem(personificationConstants.PERSONIFICATION_LOCAL_STORAGE_KEY) || 'null') || {
        personifications: {},
        personificationErrorState: nullErrorState,
        pendingActions: [],
    };
    Object.values(localStorageState.personifications).forEach((personification) => {
        personification.birthday = new Date(personification.birthday);
        personification.createdDate = new Date(personification.createdDate);
        personification.modifiedDate = new Date(personification.modifiedDate);
    });
    return localStorageState;
};

const updateLocalStorage = (state: IPersonificationState) : void => {
    localStorage.setItem(personificationConstants.PERSONIFICATION_LOCAL_STORAGE_KEY, JSON.stringify({
        personifications: state.personifications,
        personificationErrorState: nullErrorState,
        pendingActions: state.pendingActions,
    }));
};

const initState: IPersonificationState = readLocalStorage();

const personificationReducer = (state: IPersonificationState = initState, action: IPersonificationReducerAction): IPersonificationState => {
    let nextState = initState;
    switch (action.type) {
        case personificationConstants.CREATE_NEW_PERSONIFICATION:
            const pendingNewPersonification: IPersonification = action.payload;
            nextState = {
                ...state,
                personifications: {
                    ...state.personifications,
                    [-action.timestamp]: pendingNewPersonification,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.CREATE_NEW_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new personification to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified personification definition.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.CREATE_NEW_PERSONIFICATION_SUCCESS:
            // consider persisting IPersonification objects in localStorage, they're light and rare (per author)
            const newPersonification: IPersonification = action.payload;
            nextState = {
                ...state,
                personifications: {
                    ...state.personifications,
                    [newPersonification.personificationId]: newPersonification,
                },
                personificationErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.personifications[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;

        case personificationConstants.DELETE_PERSONIFICATION:
            const deletedPersonification: IPersonification = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            delete nextState.personifications[deletedPersonification.personificationId];
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.DELETE_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to delete the personification.',
                    displayErrorMessage: 'An error occurred while attempting to delete this personification.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.DELETE_PERSONIFICATION_SUCCESS:
            nextState = {
                ...state,
                personificationErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case personificationConstants.READ_ALL_PERSONIFICATIONS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_ALL_PERSONIFICATIONS_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all personifications for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the personification collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_ALL_PERSONIFICATIONS_SUCCESS:
            const personificationCollection: IPersonificationCollection = action.payload;
            nextState = {
                ...state,
                personifications: {
                    ...state.personifications
                },
                personificationErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            personificationCollection.personifications.forEach(personification => {
                nextState.personifications[personification.personificationId] = personification;
            });
            updateLocalStorage(nextState);
            return nextState;

        case personificationConstants.READ_PERSONIFICATION:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all personifications for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the personification collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_PERSONIFICATION_SUCCESS:
            const retrievedPersonification: IPersonification = action.payload;
            nextState = {
                ...state,
                personifications: {
                    ...state.personifications,
                    [retrievedPersonification.personificationId]: retrievedPersonification,
                },
                personificationErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case personificationConstants.UPDATE_PERSONIFICATION:
            const pendingUpdatedPersonification: IPersonification = action.payload;
            nextState = {
                ...state,
                personifications: {
                    ...state.personifications,
                    [pendingUpdatedPersonification.personificationId]: pendingUpdatedPersonification,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.UPDATE_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all personifications for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the personification collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.UPDATE_PERSONIFICATION_SUCCESS:
            const updatedPersonification: IPersonification = action.payload;
            nextState = {
                ...state,
                personifications: {
                    ...state.personifications,
                    [updatedPersonification.personificationId]: updatedPersonification,
                },
                personificationErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
}

export default personificationReducer;
