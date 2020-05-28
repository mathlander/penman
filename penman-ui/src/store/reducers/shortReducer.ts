import { defaultDate, shortConstants, offlineConstants } from '../../config/constants';
import { Short, UUID, IShortState, IShortErrorState, IShortReducerAction, restoreOfflineWorkItemFromJSON } from '../types';
import { ShortActionMemento } from '../actions/shortActions';

const nullErrorState: IShortErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IShortState => {
    let clientIdLookup: Record<UUID, Short> = {};
    let localStorageState: IShortState = JSON.parse(localStorage.getItem(shortConstants.SHORT_LOCAL_STORAGE_KEY) || 'null', (key, value) => {
        if (key === 'pendingActions' || key === 'offlineActionQueue') {
            return value.map((memento: string) => ShortActionMemento.hydrate(memento));
        } else if (key === 'shorts') {
            const shortRecords: Record<number, Short> = value.reduce((map: Record<number, Short>, serializedObj: string) => {
                const short = restoreOfflineWorkItemFromJSON<Short>(serializedObj, Short);
                clientIdLookup[short.clientId] = short;
                return map[short.shortId] = short;
            }, {});
            return shortRecords;
        } else if (key === '') {
            value.clientIdLookup = clientIdLookup;
        } else return value;
    }) || {
        clientIdLookup: {},
        shorts: {},
        shortErrorState: nullErrorState,
        pendingActions: [],
        offlineActionQueue: [],
        lastReadAll: defaultDate,
    };
    localStorageState.lastReadAll = (localStorageState.lastReadAll && new Date(localStorageState.lastReadAll)) || defaultDate;
    return localStorageState;
};

const updateLocalStorage = (state: IShortState) : void => {
    localStorage.setItem(shortConstants.SHORT_LOCAL_STORAGE_KEY, JSON.stringify({
        shorts: Object.values(state.shorts).map(short => short.toSerializedJSON()),
        shortErrorState: nullErrorState,
        pendingActions: state.pendingActions.map(actionMemento => actionMemento.serializedData),
        offlineActionQueue: state.offlineActionQueue.map(actionMemento => actionMemento.serializedData),
        lastReadAll: (state.lastReadAll && state.lastReadAll.toISOString()) || defaultDate.toISOString(),
    }));
};

const initState: IShortState = readLocalStorage();

const shortReducer = (state: IShortState = initState, action: IShortReducerAction): IShortState => {
    let nextState = initState;
    switch (action.type) {
        case shortConstants.SHORT_CLEAR_ERROR:
            nextState = {
                ...state,
                shortErrorState: nullErrorState,
            };
            updateLocalStorage(nextState);
            return nextState;

        case shortConstants.CREATE_NEW_SHORT:
            const pendingNewShort: Short = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingNewShort.clientId]: pendingNewShort,
                },
                shorts: {
                    ...state.shorts,
                    [-action.timestamp]: pendingNewShort,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.CREATE_NEW_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new short to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified short definition.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.CREATE_NEW_SHORT_SUCCESS:
            // consider persisting IShort objects in localStorage, they're light and rare (per author)
            const newShort: Short = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [newShort.clientId]: newShort,
                },
                shorts: {
                    ...state.shorts,
                    [newShort.shortId]: newShort,
                },
                shortErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.shorts[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.CREATE_NEW_SHORT_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
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

        case shortConstants.DELETE_SHORT:
            const deletedShort: Short = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            delete nextState.clientIdLookup[deletedShort.clientId];
            delete nextState.shorts[deletedShort.shortId];
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.DELETE_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to delete the short.',
                    displayErrorMessage: 'An error occurred while attempting to delete this short.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.DELETE_SHORT_SUCCESS:
            nextState = {
                ...state,
                shortErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.DELETE_SHORT_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
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

        case shortConstants.READ_ALL_SHORTS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_ALL_SHORTS_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all shorts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the short collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_ALL_SHORTS_SUCCESS:
            const shortCollection: Short[] = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                },
                shorts: {
                    ...state.shorts
                },
                shortErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                lastReadAll: new Date(action.timestamp),
            };
            shortCollection.forEach(short => {
                nextState.clientIdLookup[short.clientId] = short;
                nextState.shorts[short.shortId] = short;
            });
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_ALL_SHORTS_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
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

        case shortConstants.READ_SHORT:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all shorts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the short collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_SHORT_SUCCESS:
            const retrievedShort: Short = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [retrievedShort.clientId]: retrievedShort,
                },
                shorts: {
                    ...state.shorts,
                    [retrievedShort.shortId]: retrievedShort,
                },
                shortErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_SHORT_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
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

        case shortConstants.UPDATE_SHORT:
            const pendingUpdatedShort: Short = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingUpdatedShort.clientId]: pendingUpdatedShort,
                },
                shorts: {
                    ...state.shorts,
                    [pendingUpdatedShort.shortId]: pendingUpdatedShort,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.UPDATE_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all shorts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the short collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.UPDATE_SHORT_SUCCESS:
            const updatedShort: Short = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [updatedShort.clientId]: updatedShort,
                },
                shorts: {
                    ...state.shorts,
                    [updatedShort.shortId]: updatedShort,
                },
                shortErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.UPDATE_SHORT_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
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

export default shortReducer;
