import { shortConstants } from '../../constants';
import { Short, IShortState, IShortAction, nullError, apiUnreachableError, defaultShortState, UUID } from '../types';
import { ShortActionMemento } from '../actions/shortActions';
import { deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { ErrorCodes } from '../type-defs/error-types';

const readLocalStorage = (): IShortState => {
    let fromStorage = localStorage.getItem(shortConstants.SHORT_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Short> = {};
    return Object.assign(
        {},
        defaultShortState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => ShortActionMemento.hydrate(memento));
            } else if (key === 'shorts') {
                const shortRecords: Record<number, Short> = value.reduce((map: Record<number, Short>, serializedObject: string) => {
                    const short = Short.fromSerializedJSON(serializedObject);
                    uuidLookup[short.clientId] = short;
                    map[short.shortId] = short;
                    return map;
                }, {});
                return shortRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.shortErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IShortState): void => {
    localStorage.setItem(shortConstants.SHORT_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        shorts: Object.values(state.shorts).map(short => short.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};

const initState: IShortState = readLocalStorage();

const shortReducer = (state: IShortState = initState, action: IShortAction): IShortState => {
    let nextState = state;
    switch (action.type) {
        case shortConstants.SHORT_CLEAR_ERROR:
            nextState = {
                ...state,
                shortErrorState: nullError,
            };
            return nextState;
        case shortConstants.CANCEL_SHORT_ACTION:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case shortConstants.CREATE_NEW_SHORT:
            const pendingNewShort: Short = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingNewShort.clientId]: pendingNewShort,
                },
                shorts: {
                    ...state.shorts,
                    [-action.timestamp]: pendingNewShort,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.CREATE_NEW_SHORT_ERROR:
            const failedNewShort: Short = action.payload;
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to create the specified short definition.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new short to the API.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.shorts[-action.timestamp];
            delete nextState.uuidLookup[failedNewShort.clientId];
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.CREATE_NEW_SHORT_SUCCESS:
            const newShort: Short = action.payload;
            nextState = {
                ...state,
                shorts: {
                    ...state.shorts,
                    [newShort.shortId]: newShort,
                },
                shortErrorState: nullError,
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
                    : action.error || apiUnreachableError,
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
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingUpdatedShort.clientId]: pendingUpdatedShort,
                },
                shorts: {
                    ...state.shorts,
                    [pendingUpdatedShort.shortId]: pendingUpdatedShort,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.UPDATE_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to update the specified short.',
                    internalErrorMessage: 'The API returned an error while attempting to update the specified short.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case shortConstants.UPDATE_SHORT_SUCCESS:
            const updatedShort: Short = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [updatedShort.clientId]: updatedShort,
                },
                shorts: {
                    ...state.shorts,
                    [updatedShort.shortId]: updatedShort,
                },
                shortErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.UPDATE_SHORT_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
                    : action.error || apiUnreachableError,
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
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            delete nextState.uuidLookup[deletedShort.clientId];
            delete nextState.shorts[deletedShort.shortId];
            delete nextState.shorts[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.DELETE_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to delete this short.',
                    internalErrorMessage: 'The API returned an error while attempting to delete the short.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case shortConstants.DELETE_SHORT_SUCCESS:
            nextState = {
                ...state,
                shortErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case shortConstants.DELETE_SHORT_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case shortConstants.READ_SHORT:
            // const readingShort: Short = action.payload;
            nextState = {
                ...state,
                // shorts: {
                //     ...state.shorts,
                //     [readingShort.shortId]: readingShort,
                // },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified short',
                    internalErrorMessage: 'The API returned an error while attempting to read the specified short.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_SHORT_SUCCESS:
            const retrievedShort: Short = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [retrievedShort.clientId]: retrievedShort,
                },
                shorts: {
                    ...state.shorts,
                    [retrievedShort.shortId]: retrievedShort,
                },
                shortErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_SHORT_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case shortConstants.READ_ALL_SHORTS:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_ALL_SHORTS_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified short collection.',
                    internalErrorMessage: 'The API returned an error while attempting to read all shorts for the given author.',
                    errorCode: ErrorCodes.apiUnreachable,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_ALL_SHORTS_SUCCESS:
            // may want to create another lookup by userId (action.payload.targetUserId)
            nextState = {
                ...state,
                shortErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.payload.authenticatedUserId === action.payload.targetUserId) nextState.lastReadAll = action.payload.lastReadAll;
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_ALL_SHORTS_TIMEOUT:
            nextState = {
                ...state,
                shortErrorState: action.suppressTimeoutAlert
                    ? state.shortErrorState
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

export default shortReducer;
