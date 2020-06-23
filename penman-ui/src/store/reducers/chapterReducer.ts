import { chapterConstants } from '../../constants';
import { Chapter, IChapterState, IChapterAction, nullError, apiUnreachableError, defaultChapterState, UUID } from '../types';
import { ChapterActionMemento } from '../actions/chapterActions';
import { deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { ErrorCodes } from '../type-defs/error-types';

const readLocalStorage = (): IChapterState => {
    let fromStorage = localStorage.getItem(chapterConstants.CHAPTER_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let bookIdLookup: Record<number, Record<number, Chapter>> = {};
    let uuidLookup: Record<UUID, Chapter> = {};
    return Object.assign(
        {},
        defaultChapterState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => ChapterActionMemento.hydrate(memento));
            } else if (key === 'chapters') {
                const chapterRecords: Record<number, Chapter> = value.reduce((map: Record<number, Chapter>, serializedObject: string) => {
                    const chapter = Chapter.fromSerializedJSON(serializedObject);
                    uuidLookup[chapter.clientId] = chapter;
                    if (bookIdLookup[chapter.bookId]) bookIdLookup[chapter.bookId][chapter.chapterId] = chapter;
                    else bookIdLookup[chapter.bookId] = { [chapter.chapterId]: chapter };
                    map[chapter.chapterId] = chapter;
                    return map;
                }, {});
                return chapterRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.bookIdLookup = bookIdLookup;
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.chapterErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IChapterState): void => {
    localStorage.setItem(chapterConstants.CHAPTER_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        chapters: Object.values(state.chapters).map(chapter => chapter.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};

const initState: IChapterState = readLocalStorage();

const chapterReducer = (state: IChapterState = initState, action: IChapterAction): IChapterState => {
    let nextState = state;
    switch (action.type) {
        case chapterConstants.CHAPTER_CLEAR_ERROR:
            nextState = {
                ...state,
                chapterErrorState: nullError,
            };
            return nextState;
        case chapterConstants.CANCEL_CHAPTER_ACTION:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case chapterConstants.CREATE_NEW_CHAPTER:
            const pendingNewChapter: Chapter = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingNewChapter.clientId]: pendingNewChapter,
                },
                bookIdLookup: {
                    ...state.bookIdLookup,
                    [pendingNewChapter.bookId]: state.bookIdLookup[pendingNewChapter.bookId]
                        ? { ...state.bookIdLookup[pendingNewChapter.bookId], [pendingNewChapter.chapterId]: pendingNewChapter }
                        : { [pendingNewChapter.chapterId]: pendingNewChapter },
                },
                chapters: {
                    ...state.chapters,
                    [-action.timestamp]: pendingNewChapter,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.CREATE_NEW_CHAPTER_ERROR:
            const failedNewChapter: Chapter = action.payload;
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to create the specified chapter definition.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new chapter to the API.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.chapters[-action.timestamp];
            delete nextState.bookIdLookup[failedNewChapter.bookId][failedNewChapter.chapterId];
            delete nextState.uuidLookup[failedNewChapter.clientId];
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.CREATE_NEW_CHAPTER_SUCCESS:
            const newChapter: Chapter = action.payload;
            nextState = {
                ...state,
                chapters: {
                    ...state.chapters,
                    [newChapter.chapterId]: newChapter,
                },
                chapterErrorState: nullError,
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
                    : action.error || apiUnreachableError,
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
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingUpdatedChapter.clientId]: pendingUpdatedChapter,
                },
                bookIdLookup: {
                    ...state.bookIdLookup,
                    [pendingUpdatedChapter.bookId]: state.bookIdLookup[pendingUpdatedChapter.bookId]
                        ? { ...state.bookIdLookup[pendingUpdatedChapter.bookId], [pendingUpdatedChapter.chapterId]: pendingUpdatedChapter }
                        : { [pendingUpdatedChapter.chapterId]: pendingUpdatedChapter },
                },
                chapters: {
                    ...state.chapters,
                    [pendingUpdatedChapter.chapterId]: pendingUpdatedChapter,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.UPDATE_CHAPTER_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to update the specified chapter.',
                    internalErrorMessage: 'The API returned an error while attempting to update the specified chapter.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.UPDATE_CHAPTER_SUCCESS:
            const updatedChapter: Chapter = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [updatedChapter.clientId]: updatedChapter,
                },
                bookIdLookup: {
                    ...state.bookIdLookup,
                    [updatedChapter.bookId]: state.bookIdLookup[updatedChapter.bookId]
                        ? { ...state.bookIdLookup[updatedChapter.bookId], [updatedChapter.chapterId]: updatedChapter }
                        : { [updatedChapter.chapterId]: updatedChapter },
                },
                chapters: {
                    ...state.chapters,
                    [updatedChapter.chapterId]: updatedChapter,
                },
                chapterErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.UPDATE_CHAPTER_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
                    : action.error || apiUnreachableError,
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
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            delete nextState.uuidLookup[deletedChapter.clientId];
            if (nextState.bookIdLookup[deletedChapter.bookId]) {
                delete nextState.bookIdLookup[deletedChapter.bookId][deletedChapter.chapterId];
                delete nextState.bookIdLookup[deletedChapter.bookId][-action.timestamp];
            }
            delete nextState.chapters[deletedChapter.chapterId];
            delete nextState.chapters[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.DELETE_CHAPTER_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to delete this chapter.',
                    internalErrorMessage: 'The API returned an error while attempting to delete the chapter.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.DELETE_CHAPTER_SUCCESS:
            nextState = {
                ...state,
                chapterErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.DELETE_CHAPTER_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case chapterConstants.READ_CHAPTER:
            // const readingChapter: Chapter = action.payload;
            nextState = {
                ...state,
                // chapters: {
                //     ...state.chapters,
                //     [readingChapter.chapterId]: readingChapter,
                // },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_CHAPTER_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified chapter',
                    internalErrorMessage: 'The API returned an error while attempting to read the specified chapter.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_CHAPTER_SUCCESS:
            const retrievedChapter: Chapter = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [retrievedChapter.clientId]: retrievedChapter,
                },
                bookIdLookup: {
                    ...state.bookIdLookup,
                    [retrievedChapter.bookId]: state.bookIdLookup[retrievedChapter.bookId]
                        ? { ...state.bookIdLookup[retrievedChapter.bookId], [retrievedChapter.chapterId]: retrievedChapter }
                        : { [retrievedChapter.chapterId]: retrievedChapter },
                },
                chapters: {
                    ...state.chapters,
                    [retrievedChapter.chapterId]: retrievedChapter,
                },
                chapterErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_CHAPTER_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case chapterConstants.READ_ALL_CHAPTERS:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_ALL_CHAPTERS_ERROR:
            nextState = {
                ...state,
                chapterErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified chapter collection.',
                    internalErrorMessage: 'The API returned an error while attempting to read all chapters for the given author.',
                    errorCode: ErrorCodes.apiUnreachable,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_ALL_CHAPTERS_SUCCESS:
            // may want to create another lookup by userId (action.payload.targetUserId)
            nextState = {
                ...state,
                chapterErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.payload.authenticatedUserId === action.payload.targetUserId) nextState.lastReadAll = action.payload.lastReadAll;
            updateLocalStorage(nextState);
            return nextState;
        case chapterConstants.READ_ALL_CHAPTERS_TIMEOUT:
            nextState = {
                ...state,
                chapterErrorState: action.suppressTimeoutAlert
                    ? state.chapterErrorState
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

export default chapterReducer;
