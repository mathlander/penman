import { defaultDate, personificationConstants, offlineConstants } from '../../config/constants';
import { Personification, UUID, IPersonificationState, IPersonificationErrorState, IPersonificationReducerAction, restoreOfflineWorkItemFromJSON } from '../types';
import { PersonificationActionMemento } from '../actions/personificationActions';

const nullErrorState: IPersonificationErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IPersonificationState => {
    let clientIdLookup: Record<UUID, Personification> = {};
    let localStorageState: IPersonificationState = JSON.parse(localStorage.getItem(personificationConstants.PERSONIFICATION_LOCAL_STORAGE_KEY) || 'null', (key, value) => {
        if (key === 'pendingActions' || key === 'offlineActionQueue') {
            return value.map((memento: string) => PersonificationActionMemento.hydrate(memento));
        } else if (key === 'personifications') {
            const personificationRecords: Record<number, Personification> = value.reduce((map: Record<number, Personification>, serializedObj: string) => {
                const personification = restoreOfflineWorkItemFromJSON<Personification>(serializedObj, Personification);
                clientIdLookup[personification.clientId] = personification;
                return map[personification.personificationId] = personification;
            }, {});
            return personificationRecords;
        } else if (key === '') {
            value.clientIdLookup = clientIdLookup;
        } else return value;
    }) || {
        clientIdLookup: {},
        personifications: {},
        personificationErrorState: nullErrorState,
        pendingActions: [],
        offlineActionQueue: [],
        lastReadAll: defaultDate,
    };
    localStorageState.lastReadAll = (localStorageState.lastReadAll && new Date(localStorageState.lastReadAll)) || defaultDate;
    return localStorageState;
};

const updateLocalStorage = (state: IPersonificationState) : void => {
    localStorage.setItem(personificationConstants.PERSONIFICATION_LOCAL_STORAGE_KEY, JSON.stringify({
        personifications: Object.values(state.personifications).map(personification => personification.toSerializedJSON()),
        personificationErrorState: nullErrorState,
        pendingActions: state.pendingActions.map(actionMemento => actionMemento.serializedData),
        offlineActionQueue: state.offlineActionQueue.map(actionMemento => actionMemento.serializedData),
        lastReadAll: (state.lastReadAll && state.lastReadAll.toISOString()) || defaultDate.toISOString(),
    }));
};

const initState: IPersonificationState = readLocalStorage();

const personificationReducer = (state: IPersonificationState = initState, action: IPersonificationReducerAction): IPersonificationState => {
    let nextState = initState;
    switch (action.type) {
        case personificationConstants.PERSONIFICATION_CLEAR_ERROR:
            nextState = {
                ...state,
                personificationErrorState: nullErrorState,
            };
            updateLocalStorage(nextState);
            return nextState;

        case personificationConstants.CREATE_NEW_PERSONIFICATION:
            const pendingNewPersonification: Personification = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingNewPersonification.clientId]: pendingNewPersonification,
                },
                personifications: {
                    ...state.personifications,
                    [-action.timestamp]: pendingNewPersonification,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.CREATE_NEW_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new personification to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified personification definition.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.CREATE_NEW_PERSONIFICATION_SUCCESS:
            // consider persisting IPersonification objects in localStorage, they're light and rare (per author)
            const newPersonification: Personification = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [newPersonification.clientId]: newPersonification,
                },
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
        case personificationConstants.CREATE_NEW_PERSONIFICATION_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
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

        case personificationConstants.DELETE_PERSONIFICATION:
            const deletedPersonification: Personification = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            delete nextState.clientIdLookup[deletedPersonification.clientId];
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
        case personificationConstants.DELETE_PERSONIFICATION_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
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

        case personificationConstants.READ_ALL_PERSONIFICATIONS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_ALL_PERSONIFICATIONS_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all personifications for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the personification collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_ALL_PERSONIFICATIONS_SUCCESS:
            const personificationCollection: Personification[] = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                },
                personifications: {
                    ...state.personifications
                },
                personificationErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                lastReadAll: new Date(action.timestamp),
            };
            personificationCollection.forEach(personification => {
                nextState.clientIdLookup[personification.clientId] = personification;
                nextState.personifications[personification.personificationId] = personification;
            });
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_ALL_PERSONIFICATIONS_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
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

        case personificationConstants.READ_PERSONIFICATION:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all personifications for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the personification collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_PERSONIFICATION_SUCCESS:
            const retrievedPersonification: Personification = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [retrievedPersonification.clientId]: retrievedPersonification,
                },
                personifications: {
                    ...state.personifications,
                    [retrievedPersonification.personificationId]: retrievedPersonification,
                },
                personificationErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_PERSONIFICATION_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
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

        case personificationConstants.UPDATE_PERSONIFICATION:
            const pendingUpdatedPersonification: Personification = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingUpdatedPersonification.clientId]: pendingUpdatedPersonification,
                },
                personifications: {
                    ...state.personifications,
                    [pendingUpdatedPersonification.personificationId]: pendingUpdatedPersonification,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.UPDATE_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all personifications for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the personification collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.UPDATE_PERSONIFICATION_SUCCESS:
            const updatedPersonification: Personification = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [updatedPersonification.clientId]: updatedPersonification,
                },
                personifications: {
                    ...state.personifications,
                    [updatedPersonification.personificationId]: updatedPersonification,
                },
                personificationErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.UPDATE_PERSONIFICATION_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
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

export default personificationReducer;
