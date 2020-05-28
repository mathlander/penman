import { defaultDate, chapterConstants, offlineConstants } from '../../config/constants';
import { Chapter, UUID, IChapterState, IChapterErrorState, IChapterReducerAction, restoreOfflineWorkItemFromJSON } from '../types';
import { ChapterActionMemento } from '../actions/chapterActions';

const nullErrorState: IChapterErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IChapterState => {
    let clientIdLookup: Record<UUID, Chapter> = {};
    let localStorageState: IChapterState = JSON.parse(localStorage.getItem(chapterConstants.CHAPTER_LOCAL_STORAGE_KEY) || 'null', (key, value) => {
        if (key === 'pendingActions' || key === 'offlineActionQueue') {
            return value.map((memento: string) => ChapterActionMemento.hydrate(memento));
        } else if (key === 'chapters') {
            const chapterRecords: Record<number, Chapter> = value.reduce((map: Record<number, Chapter>, serializedObj: string) => {
                const chapter = restoreOfflineWorkItemFromJSON<Chapter>(serializedObj, Chapter);
                clientIdLookup[chapter.clientId] = chapter;
                return map[chapter.chapterId] = chapter;
            }, {});
            return chapterRecords;
        } else if (key === '') {
            value.clientIdLookup = clientIdLookup;
        } else return value;
    }) || {
        clientIdLookup: {},
        chapters: {},
        chapterErrorState: nullErrorState,
        pendingActions: [],
        offlineActionQueue: [],
        lastReadAll: defaultDate,
    };
    localStorageState.lastReadAll = (localStorageState.lastReadAll && new Date(localStorageState.lastReadAll)) || defaultDate;
    return localStorageState;
};

const updateLocalStorage = (state: IChapterState) : void => {
    localStorage.setItem(chapterConstants.CHAPTER_LOCAL_STORAGE_KEY, JSON.stringify({
        chapters: Object.values(state.chapters).map(chapter => chapter.toSerializedJSON()),
        chapterErrorState: nullErrorState,
        pendingActions: state.pendingActions.map(actionMemento => actionMemento.serializedData),
        offlineActionQueue: state.offlineActionQueue.map(actionMemento => actionMemento.serializedData),
        lastReadAll: (state.lastReadAll && state.lastReadAll.toISOString()) || defaultDate.toISOString(),
    }));
};

const initState: IChapterState = readLocalStorage();

const chapterReducer = (state: IChapterState = initState, action: IChapterReducerAction): IChapterState => {
    let nextState = initState;
    switch (action.type) {
        case chapterConstants.CHAPTER_CLEAR_ERROR:
            nextState = {
                ...state,
                chapterErrorState: nullErrorState,
            };
            updateLocalStorage(nextState);
            return nextState;

        case chapterConstants.CREATE_NEW_CHAPTER:
            const pendingNewChapter: Chapter = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingNewChapter.clientId]: pendingNewChapter,
                },
                chapters: {
                    ...state.chapters,
                    [-action.timestamp]: pendingNewChapter,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.CREATE_NEW_CHAPTER_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new chapter to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified chapter definition.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.CREATE_NEW_CHAPTER_SUCCESS:
            // consider persisting IChapter objects in localStorage, they're light and rare (per author)
            const newChapter: Chapter = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [newChapter.clientId]: newChapter,
                },
                chapters: {
                    ...state.chapters,
                    [newChapter.chapterId]: newChapter,
                },
                chapterErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.chapters[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.CREATE_NEW_CHAPTER_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
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

        case chapterConstants.DELETE_CHAPTER:
            const deletedChapter: Chapter = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            delete nextState.clientIdLookup[deletedChapter.chapterId];
            delete nextState.chapters[deletedChapter.chapterId];
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.DELETE_CHAPTER_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to delete the chapter.',
                    displayErrorMessage: 'An error occurred while attempting to delete this chapter.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.DELETE_CHAPTER_SUCCESS:
            nextState = {
                ...state,
                chapterErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.DELETE_CHAPTER_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
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

        case chapterConstants.READ_ALL_CHAPTERS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_ALL_CHAPTERS_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all chapters for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the chapter collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_ALL_CHAPTERS_SUCCESS:
            const chapterCollection: Chapter[] = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                },
                chapters: {
                    ...state.chapters
                },
                chapterErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                lastReadAll: new Date(action.timestamp),
            };
            chapterCollection.forEach(chapter => {
                nextState.clientIdLookup[chapter.clientId] = chapter;
                nextState.chapters[chapter.chapterId] = chapter;
            });
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_ALL_CHAPTERS_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
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

        case chapterConstants.READ_CHAPTER:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_CHAPTER_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all chapters for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the chapter collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_CHAPTER_SUCCESS:
            const retrievedChapter: Chapter = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [retrievedChapter.clientId]: retrievedChapter,
                },
                chapters: {
                    ...state.chapters,
                    [retrievedChapter.chapterId]: retrievedChapter,
                },
                chapterErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_CHAPTER_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
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

        case chapterConstants.UPDATE_CHAPTER:
            const pendingUpdatedChapter: Chapter = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingUpdatedChapter.clientId]: pendingUpdatedChapter,
                },
                chapters: {
                    ...state.chapters,
                    [pendingUpdatedChapter.chapterId]: pendingUpdatedChapter,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.UPDATE_CHAPTER_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all chapters for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the chapter collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.UPDATE_CHAPTER_SUCCESS:
            const updatedChapter: Chapter = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [updatedChapter.clientId]: updatedChapter,
                },
                chapters: {
                    ...state.chapters,
                    [updatedChapter.chapterId]: updatedChapter,
                },
                chapterErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.UPDATE_CHAPTER_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
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

export default chapterReducer;
