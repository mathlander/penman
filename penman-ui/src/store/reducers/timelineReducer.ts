import { timelineConstants } from '../../config/constants';
import { ITimeline, ITimelineCollection, ITimelineState, ITimelineErrorState, ITimelineReducerAction } from '../types';

const nullErrorState: ITimelineErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : ITimelineState => {
    let localStorageState: ITimelineState = JSON.parse(localStorage.getItem(timelineConstants.TIMELINE_LOCAL_STORAGE_KEY) || 'null') || {
        timelines: {},
        timelineErrorState: nullErrorState,
        pendingActions: [],
    };
    Object.values(localStorageState.timelines).forEach((timeline) => {
        timeline.eventStart = new Date(timeline.eventStart);
        timeline.eventEnd = new Date(timeline.eventEnd);
        timeline.createdDate = new Date(timeline.createdDate);
        timeline.modifiedDate = new Date(timeline.modifiedDate);
    });
    return localStorageState;
};

const updateLocalStorage = (state: ITimelineState) : void => {
    localStorage.setItem(timelineConstants.TIMELINE_LOCAL_STORAGE_KEY, JSON.stringify({
        timelines: state.timelines,
        timelineErrorState: nullErrorState,
        pendingActions: state.pendingActions,
    }));
};

const initState: ITimelineState = readLocalStorage();

const timelineReducer = (state: ITimelineState = initState, action: ITimelineReducerAction): ITimelineState => {
    let nextState = initState;
    switch (action.type) {
        case timelineConstants.CREATE_NEW_TIMELINE:
            const pendingNewTimeline: ITimeline = action.payload;
            nextState = {
                ...state,
                timelines: {
                    ...state.timelines,
                    [-action.timestamp]: pendingNewTimeline,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.CREATE_NEW_TIMELINE_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new timeline to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified timeline definition.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.CREATE_NEW_TIMELINE_SUCCESS:
            // consider persisting ITimeline objects in localStorage, they're light and rare (per author)
            const newTimeline: ITimeline = action.payload;
            nextState = {
                ...state,
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

        case timelineConstants.DELETE_TIMELINE:
            const deletedTimeline: ITimeline = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
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
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
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

        case timelineConstants.READ_ALL_TIMELINES:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_ALL_TIMELINES_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all timelines for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the timeline collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_ALL_TIMELINES_SUCCESS:
            const timelineCollection: ITimelineCollection = action.payload;
            nextState = {
                ...state,
                timelines: {
                    ...state.timelines
                },
                timelineErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            timelineCollection.timelines.forEach(timeline => {
                nextState.timelines[timeline.timelineId] = timeline;
            });
            updateLocalStorage(nextState);
            return nextState;

        case timelineConstants.READ_TIMELINE:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_TIMELINE_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all timelines for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the timeline collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.READ_TIMELINE_SUCCESS:
            const retrievedTimeline: ITimeline = action.payload;
            nextState = {
                ...state,
                timelines: {
                    ...state.timelines,
                    [retrievedTimeline.timelineId]: retrievedTimeline,
                },
                timelineErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case timelineConstants.UPDATE_TIMELINE:
            const pendingUpdatedTimeline: ITimeline = action.payload;
            nextState = {
                ...state,
                timelines: {
                    ...state.timelines,
                    [pendingUpdatedTimeline.timelineId]: pendingUpdatedTimeline,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.UPDATE_TIMELINE_ERROR:
            nextState = {
                ...state,
                timelineErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all timelines for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the timeline collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case timelineConstants.UPDATE_TIMELINE_SUCCESS:
            const updatedTimeline: ITimeline = action.payload;
            nextState = {
                ...state,
                timelines: {
                    ...state.timelines,
                    [updatedTimeline.timelineId]: updatedTimeline,
                },
                timelineErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
}

export default timelineReducer;
