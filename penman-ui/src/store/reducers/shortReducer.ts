import { shortConstants } from '../../config/constants';
import { IShort, IShortCollection, IShortState, IShortErrorState, IShortReducerAction } from '../types';

const nullErrorState: IShortErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IShortState => {
    let localStorageState: IShortState = JSON.parse(localStorage.getItem(shortConstants.SHORT_LOCAL_STORAGE_KEY) || 'null') || {
        shorts: {},
        shortErrorState: nullErrorState,
        pendingActions: [],
    };
    Object.values(localStorageState.shorts).forEach((short) => {
        short.eventStart = new Date(short.eventStart);
        short.eventEnd = new Date(short.eventEnd);
        short.createdDate = new Date(short.createdDate);
        short.modifiedDate = new Date(short.modifiedDate);
    });
    return localStorageState;
};

const updateLocalStorage = (state: IShortState) : void => {
    localStorage.setItem(shortConstants.SHORT_LOCAL_STORAGE_KEY, JSON.stringify({
        shorts: state.shorts,
        shortErrorState: nullErrorState,
        pendingActions: state.pendingActions,
    }));
};

const initState: IShortState = readLocalStorage();

const shortReducer = (state: IShortState = initState, action: IShortReducerAction): IShortState => {
    let nextState = initState;
    switch (action.type) {
        case shortConstants.CREATE_NEW_SHORT:
            const pendingNewShort: IShort = action.payload;
            nextState = {
                ...state,
                shorts: {
                    ...state.shorts,
                    [-action.timestamp]: pendingNewShort,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.CREATE_NEW_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new short to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified short definition.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.CREATE_NEW_SHORT_SUCCESS:
            // consider persisting IShort objects in localStorage, they're light and rare (per author)
            const newShort: IShort = action.payload;
            nextState = {
                ...state,
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

        case shortConstants.DELETE_SHORT:
            const deletedShort: IShort = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
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
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
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

        case shortConstants.READ_ALL_SHORTS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_ALL_SHORTS_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all shorts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the short collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_ALL_SHORTS_SUCCESS:
            const shortCollection: IShortCollection = action.payload;
            nextState = {
                ...state,
                shorts: {
                    ...state.shorts
                },
                shortErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            shortCollection.shorts.forEach(short => {
                nextState.shorts[short.shortId] = short;
            });
            updateLocalStorage(nextState);
            return nextState;

        case shortConstants.READ_SHORT:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all shorts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the short collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.READ_SHORT_SUCCESS:
            const retrievedShort: IShort = action.payload;
            nextState = {
                ...state,
                shorts: {
                    ...state.shorts,
                    [retrievedShort.shortId]: retrievedShort,
                },
                shortErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case shortConstants.UPDATE_SHORT:
            const pendingUpdatedShort: IShort = action.payload;
            nextState = {
                ...state,
                shorts: {
                    ...state.shorts,
                    [pendingUpdatedShort.shortId]: pendingUpdatedShort,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.UPDATE_SHORT_ERROR:
            nextState = {
                ...state,
                shortErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all shorts for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the short collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case shortConstants.UPDATE_SHORT_SUCCESS:
            const updatedShort: IShort = action.payload;
            nextState = {
                ...state,
                shorts: {
                    ...state.shorts,
                    [updatedShort.shortId]: updatedShort,
                },
                shortErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
}

export default shortReducer;
