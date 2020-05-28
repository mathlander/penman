import { defaultDate, timelineConstants, offlineConstants } from '../../config/constants';
import { Timeline, UUID, ITimelineState, ITimelineErrorState, ITimelineReducerAction, restoreOfflineWorkItemFromJSON } from '../types';
import { TimelineActionMemento } from '../actions/timelineActions';

const nullErrorState: ITimelineErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : ITimelineState => {
    let clientIdLookup: Record<UUID, Timeline> = {};
    let localStorageState: ITimelineState = JSON.parse(localStorage.getItem(timelineConstants.TIMELINE_LOCAL_STORAGE_KEY) || 'null', (key, value) => {
        if (key === 'pendingActions' || key === 'offlineActionQueue') {
            return value.map((memento: string) => TimelineActionMemento.hydrate(memento));
        } else if (key === 'shorts') {
            const timelineRecords: Record<number, Timeline> = value.reduce((map: Record<number, Timeline>, serializedObj: string) => {
                const timeline = restoreOfflineWorkItemFromJSON<Timeline>(serializedObj, Timeline);
                clientIdLookup[timeline.clientId] = timeline;
                return map[timeline.timelineId] = timeline;
            }, {});
            return timelineRecords;
        } else if (key === '') {
            value.clientIdLookup = clientIdLookup;
        } else return value;
    }) || {
        clientIdLookup: {},
        timelines: {},
        timelineErrorState: nullErrorState,
        pendingActions: [],
        offlineActionQueue: [],
        lastReadAll: defaultDate,
    };
    localStorageState.lastReadAll = (localStorageState.lastReadAll && new Date(localStorageState.lastReadAll)) || defaultDate;
    return localStorageState;
};

const updateLocalStorage = (state: ITimelineState) : void => {
    localStorage.setItem(timelineConstants.TIMELINE_LOCAL_STORAGE_KEY, JSON.stringify({
        timelines: Object.values(state.timelines).map(timeline => timeline.toSerializedJSON()),
        timelineErrorState: nullErrorState,
        pendingActions: state.pendingActions.map(actionMemento => actionMemento.serializedData),
        offlineActionQueue: state.offlineActionQueue.map(actionMemento => actionMemento.serializedData),
        lastReadAll: (state.lastReadAll && state.lastReadAll.toISOString()) || defaultDate.toISOString(),
    }));
};

const initState: ITimelineState = readLocalStorage();

const timelineReducer = (state: ITimelineState = initState, action: ITimelineReducerAction): ITimelineState => {
    let nextState = initState;
    switch (action.type) {
        case timelineConstants.TIMELINE_CLEAR_ERROR:
            nextState = {
                ...state,
                timelineErrorState: nullErrorState,
            };
            updateLocalStorage(nextState);
            return nextState;

        case timelineConstants.CREATE_NEW_TIMELINE:
            const pendingNewTimeline: Timeline = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingNewTimeline.clientId]: pendingNewTimeline,
                },
                timelines: {
                    ...state.timelines,
                    [-action.timestamp]: pendingNewTimeline,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.CREATE_NEW_TIMELINE_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new timeline to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified timeline definition.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.CREATE_NEW_TIMELINE_SUCCESS:
            // consider persisting ITimeline objects in localStorage, they're light and rare (per author)
            const newTimeline: Timeline = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [newTimeline.clientId]: newTimeline,
                },
                timelines: {
                    ...state.timelines,
                    [newTimeline.timelineId]: newTimeline,
                },
                timelineErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.timelines[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.CREATE_NEW_TIMELINE_TIMEOUT:
            nextState = {
                ...state,
                timelineErrorState: action.suppressTimeoutAlert
                    ? state.timelineErrorState
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

        case timelineConstants.DELETE_TIMELINE:
            const deletedTimeline: Timeline = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            delete nextState.clientIdLookup[deletedTimeline.clientId];
            delete nextState.timelines[deletedTimeline.timelineId];
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.DELETE_TIMELINE_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to delete the timeline.',
                    displayErrorMessage: 'An error occurred while attempting to delete this timeline.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.DELETE_TIMELINE_SUCCESS:
            nextState = {
                ...state,
                timelineErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.DELETE_TIMELINE_TIMEOUT:
            nextState = {
                ...state,
                timelineErrorState: action.suppressTimeoutAlert
                    ? state.timelineErrorState
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

        case timelineConstants.READ_ALL_TIMELINES:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_ALL_TIMELINES_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all timelines for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the timeline collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_ALL_TIMELINES_SUCCESS:
            const timelineCollection: Timeline[] = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                },
                timelines: {
                    ...state.timelines
                },
                timelineErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                lastReadAll: new Date(action.timestamp),
            };
            timelineCollection.forEach(timeline => {
                nextState.clientIdLookup[timeline.clientId] = timeline;
                nextState.timelines[timeline.timelineId] = timeline;
            });
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_ALL_TIMELINES_TIMEOUT:
            nextState = {
                ...state,
                timelineErrorState: action.suppressTimeoutAlert
                    ? state.timelineErrorState
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

        case timelineConstants.READ_TIMELINE:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_TIMELINE_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all timelines for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the timeline collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_TIMELINE_SUCCESS:
            const retrievedTimeline: Timeline = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [retrievedTimeline.clientId]: retrievedTimeline,
                },
                timelines: {
                    ...state.timelines,
                    [retrievedTimeline.timelineId]: retrievedTimeline,
                },
                timelineErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_TIMELINE_TIMEOUT:
            nextState = {
                ...state,
                timelineErrorState: action.suppressTimeoutAlert
                    ? state.timelineErrorState
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

        case timelineConstants.UPDATE_TIMELINE:
            const pendingUpdatedTimeline: Timeline = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingUpdatedTimeline.clientId]: pendingUpdatedTimeline,
                },
                timelines: {
                    ...state.timelines,
                    [pendingUpdatedTimeline.timelineId]: pendingUpdatedTimeline,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.UPDATE_TIMELINE_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all timelines for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the timeline collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.UPDATE_TIMELINE_SUCCESS:
            const updatedTimeline: Timeline = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [updatedTimeline.clientId]: updatedTimeline,
                },
                timelines: {
                    ...state.timelines,
                    [updatedTimeline.timelineId]: updatedTimeline,
                },
                timelineErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.UPDATE_TIMELINE_TIMEOUT:
            nextState = {
                ...state,
                timelineErrorState: action.suppressTimeoutAlert
                    ? state.timelineErrorState
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

export default timelineReducer;
