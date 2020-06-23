import { personificationConstants } from '../../constants';
import { Personification, IPersonificationState, IPersonificationAction, nullError, apiUnreachableError, defaultPersonificationState, UUID } from '../types';
import { PersonificationActionMemento } from '../actions/personificationActions';
import { deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { ErrorCodes } from '../type-defs/error-types';

const readLocalStorage = (): IPersonificationState => {
    let fromStorage = localStorage.getItem(personificationConstants.PERSONIFICATION_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Personification> = {};
    return Object.assign(
        {},
        defaultPersonificationState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => PersonificationActionMemento.hydrate(memento));
            } else if (key === 'personifications') {
                const personificationRecords: Record<number, Personification> = value.reduce((map: Record<number, Personification>, serializedObject: string) => {
                    const personification = Personification.fromSerializedJSON(serializedObject);
                    uuidLookup[personification.clientId] = personification;
                    map[personification.personificationId] = personification;
                    return map;
                }, {});
                return personificationRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.personificationErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IPersonificationState): void => {
    localStorage.setItem(personificationConstants.PERSONIFICATION_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        personifications: Object.values(state.personifications).map(personification => personification.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};

const initState: IPersonificationState = readLocalStorage();

const personificationReducer = (state: IPersonificationState = initState, action: IPersonificationAction): IPersonificationState => {
    let nextState = state;
    switch (action.type) {
        case personificationConstants.PERSONIFICATION_CLEAR_ERROR:
            nextState = {
                ...state,
                personificationErrorState: nullError,
            };
            return nextState;
        case personificationConstants.CANCEL_PERSONIFICATION_ACTION:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case personificationConstants.CREATE_NEW_PERSONIFICATION:
            const pendingNewPersonification: Personification = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingNewPersonification.clientId]: pendingNewPersonification,
                },
                personifications: {
                    ...state.personifications,
                    [-action.timestamp]: pendingNewPersonification,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.CREATE_NEW_PERSONIFICATION_ERROR:
            const failedNewPersonification: Personification = action.payload;
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to create the specified personification definition.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new personification to the API.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.personifications[-action.timestamp];
            delete nextState.uuidLookup[failedNewPersonification.clientId];
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.CREATE_NEW_PERSONIFICATION_SUCCESS:
            const newPersonification: Personification = action.payload;
            nextState = {
                ...state,
                personifications: {
                    ...state.personifications,
                    [newPersonification.personificationId]: newPersonification,
                },
                personificationErrorState: nullError,
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
                    : action.error || apiUnreachableError,
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
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingUpdatedPersonification.clientId]: pendingUpdatedPersonification,
                },
                personifications: {
                    ...state.personifications,
                    [pendingUpdatedPersonification.personificationId]: pendingUpdatedPersonification,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.UPDATE_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to update the specified personification.',
                    internalErrorMessage: 'The API returned an error while attempting to update the specified personification.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.UPDATE_PERSONIFICATION_SUCCESS:
            const updatedPersonification: Personification = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [updatedPersonification.clientId]: updatedPersonification,
                },
                personifications: {
                    ...state.personifications,
                    [updatedPersonification.personificationId]: updatedPersonification,
                },
                personificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.UPDATE_PERSONIFICATION_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
                    : action.error || apiUnreachableError,
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
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            delete nextState.uuidLookup[deletedPersonification.clientId];
            delete nextState.personifications[deletedPersonification.personificationId];
            delete nextState.personifications[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.DELETE_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to delete this personification.',
                    internalErrorMessage: 'The API returned an error while attempting to delete the personification.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.DELETE_PERSONIFICATION_SUCCESS:
            nextState = {
                ...state,
                personificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.DELETE_PERSONIFICATION_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case personificationConstants.READ_PERSONIFICATION:
            // const readingPersonification: Personification = action.payload;
            nextState = {
                ...state,
                // personifications: {
                //     ...state.personifications,
                //     [readingPersonification.personificationId]: readingPersonification,
                // },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_PERSONIFICATION_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified personification',
                    internalErrorMessage: 'The API returned an error while attempting to read the specified personification.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_PERSONIFICATION_SUCCESS:
            const retrievedPersonification: Personification = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [retrievedPersonification.clientId]: retrievedPersonification,
                },
                personifications: {
                    ...state.personifications,
                    [retrievedPersonification.personificationId]: retrievedPersonification,
                },
                personificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_PERSONIFICATION_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case personificationConstants.READ_ALL_PERSONIFICATIONS:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_ALL_PERSONIFICATIONS_ERROR:
            nextState = {
                ...state,
                personificationErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified personification collection.',
                    internalErrorMessage: 'The API returned an error while attempting to read all personifications for the given author.',
                    errorCode: ErrorCodes.apiUnreachable,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_ALL_PERSONIFICATIONS_SUCCESS:
            // may want to create another lookup by userId (action.payload.targetUserId)
            nextState = {
                ...state,
                personificationErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.payload.authenticatedUserId === action.payload.targetUserId) nextState.lastReadAll = action.payload.lastReadAll;
            updateLocalStorage(nextState);
            return nextState;
        case personificationConstants.READ_ALL_PERSONIFICATIONS_TIMEOUT:
            nextState = {
                ...state,
                personificationErrorState: action.suppressTimeoutAlert
                    ? state.personificationErrorState
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

export default personificationReducer;
