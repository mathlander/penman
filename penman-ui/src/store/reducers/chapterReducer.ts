import { defaultDate, chapterConstants, offlineConstants } from '../../config/constants';
import { IChapter, IChapterCollection, IChapterState, IChapterErrorState, IChapterReducerAction } from '../types';

const nullErrorState: IChapterErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IChapterState => {
    let localStorageState: IChapterState = JSON.parse(localStorage.getItem(chapterConstants.CHAPTER_LOCAL_STORAGE_KEY) || 'null') || {
        chapters: {},
        chapterErrorState: nullErrorState,
        pendingActions: [],
        offlineActionQueue: [],
        lastReadAll: defaultDate,
    };
    Object.values(localStorageState.chapters).forEach((chapter) => {
        chapter.createdDate = new Date(chapter.createdDate);
        chapter.modifiedDate = new Date(chapter.modifiedDate);
    });
    localStorageState.lastReadAll = (localStorageState.lastReadAll && new Date(localStorageState.lastReadAll)) || defaultDate;
    return localStorageState;
};

const updateLocalStorage = (state: IChapterState) : void => {
    localStorage.setItem(chapterConstants.CHAPTER_LOCAL_STORAGE_KEY, JSON.stringify({
        chapters: state.chapters,
        chapterErrorState: nullErrorState,
        pendingActions: state.pendingActions,
        offlineActionQueue: state.offlineActionQueue,
        lastReadAll: (state.lastReadAll && state.lastReadAll.toISOString()) || defaultDate.toISOString(),
    }));
};

const initState: IChapterState = readLocalStorage();

const chapterReducer = (state: IChapterState = initState, action: IChapterReducerAction): IChapterState => {
    let nextState = initState;
    switch (action.type) {
        case chapterConstants.CREATE_NEW_CHAPTER:
            const pendingNewChapter: IChapter = action.payload;
            nextState = {
                ...state,
                chapters: {
                    ...state.chapters,
                    [-action.timestamp]: pendingNewChapter,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
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
            const newChapter: IChapter = action.payload;
            nextState = {
                ...state,
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
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;

        case chapterConstants.DELETE_CHAPTER:
            const deletedChapter: IChapter = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
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
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;

        case chapterConstants.READ_ALL_CHAPTERS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
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
            const chapterCollection: IChapterCollection = action.payload;
            nextState = {
                ...state,
                chapters: {
                    ...state.chapters
                },
                chapterErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                lastReadAll: new Date(action.timestamp),
            };
            chapterCollection.chapters.forEach(chapter => {
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
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;

        case chapterConstants.READ_CHAPTER:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
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
            const retrievedChapter: IChapter = action.payload;
            nextState = {
                ...state,
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
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;

        case chapterConstants.UPDATE_CHAPTER:
            const pendingUpdatedChapter: IChapter = action.payload;
            nextState = {
                ...state,
                chapters: {
                    ...state.chapters,
                    [pendingUpdatedChapter.chapterId]: pendingUpdatedChapter,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
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
            const updatedChapter: IChapter = action.payload;
            nextState = {
                ...state,
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
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
}

export default chapterReducer;
