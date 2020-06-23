import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { apiConstants, offlineConstants, chapterConstants } from '../../constants';
import { UUID, IRootState, IReplayableAction, Chapter, IReplayUser, IError, ErrorCodes, Book, IClientChapter, IChapterCollection, nullError } from '../types';

export class ChapterActionMemento implements IReplayableAction {
    public chapter: Chapter;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string;
    public serializedData: string;

    constructor(chapter: Chapter, type: string, timestamp: number, lastReadAllISOString = '') {
        this.chapter = chapter;
        this.type = type;
        this.timestamp = timestamp;
        this.lastReadAllISOString = lastReadAllISOString;
        this.serializedData = ChapterActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'chapter') return Chapter.fromSerializedJSON(value);
            else return value;
        });
        return new ChapterActionMemento(restoredMemento.chapter, restoredMemento.type, restoredMemento.timestamp, restoredMemento.lastReadAllISOString);
    }

    static dehydrate(actionMemento: ChapterActionMemento) {
        const serializedMemento = JSON.stringify({
            chapter: actionMemento.chapter.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAllISOString: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user: IReplayUser, isOffline: boolean) {
        if (this.chapter.bookId <= 0) {
            const book: Book | null = useSelector((state: IRootState) => {
                return state.book.uuidLookup[this.chapter.bookClientId]
                    ?? Object.values(state.book.books).filter((value) => value.clientIdHistory.includes(this.chapter.bookClientId)).pop()
                    ?? null;
            });
            if (book === null && this.type !== chapterConstants.DELETE_CHAPTER) {
                const dispatch = useDispatch();
                const error: IError = {
                    displayErrorMessage: ``,
                    internalErrorMessage: `Dependency is no longer present.  Canceling the current action.`,
                    errorCode: ErrorCodes.dependencyNoLongerExists,
                };
                dispatch({ type: chapterConstants.CANCEL_CHAPTER_ACTION, error, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                return;
            } else if (book !== null) {
                this.chapter.bookId = book.bookId;
                this.serializedData = ChapterActionMemento.dehydrate(this);
            }
        }
        switch (this.type) {
            case chapterConstants.CREATE_NEW_CHAPTER:
                this.create(user, isOffline, true);
                break;
            case chapterConstants.UPDATE_CHAPTER:
                this.update(user, isOffline, true);
                break;
            case chapterConstants.DELETE_CHAPTER:
                this.deleteEntity(user, isOffline, true);
                break;
            case chapterConstants.READ_CHAPTER:
                this.read(user, isOffline, true);
                break;
            case chapterConstants.READ_ALL_CHAPTERS:
                this.readAll(user, isOffline, true);
                break;
            default:
                break;
        }
    }

    public create(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/create`;
        const data = this.chapter.toCreateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.post(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientChapter>) => {
            this.chapter.onApiProcessed(response.data, true);
            dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_SUCCESS, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else if (err.response && err.response.data && err.response.data.errorCode === ErrorCodes.clientIdCollided) {
                this.chapter.handleIdCollision();
                this.create(user, isOffline);
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the new chapter: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public update(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/update`;
        const data = this.chapter.toUpdateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.UPDATE_CHAPTER, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: chapterConstants.UPDATE_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.patch(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientChapter>) => {
            this.chapter.onApiProcessed(response.data, true);
            dispatch({ type: chapterConstants.UPDATE_CHAPTER_SUCCESS, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: chapterConstants.UPDATE_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the specified chapter: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: chapterConstants.UPDATE_CHAPTER_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public deleteEntity(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/delete?userId=${user.userId}&chapterId=${this.chapter.chapterId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.DELETE_CHAPTER, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: chapterConstants.DELETE_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: chapterConstants.DELETE_CHAPTER_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: chapterConstants.DELETE_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to delete the specified chapter: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: chapterConstants.DELETE_CHAPTER_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public read(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/read?chapterId=${this.chapter.chapterId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.READ_CHAPTER, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: chapterConstants.READ_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IClientChapter>) => {
            this.chapter.onApiProcessed(response.data);
            dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: chapterConstants.READ_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve the specified chapter: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: chapterConstants.READ_CHAPTER_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public readAll(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/readall?userId=${this.chapter.userId}&bookId=${this.chapter.bookId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.READ_ALL_CHAPTERS, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IChapterCollection>) => {
            const lastReadAll = new Date(response.data.lastReadAll);
            const chapterCollection = response.data.chapters;
            chapterCollection.forEach((chapterDto) => {
                const chapter = new Chapter(chapterDto);
                dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            });
            dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_SUCCESS, payload: { targetUserId: this.chapter.userId, bookId: this.chapter.bookId, lastReadAll }, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve all chapters for the specified book: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        })
    }
}

export const create = (user: IReplayUser, newChapter: Chapter, isOffline = false) => {
    const timestamp = Date.now();
    newChapter.chapterId = -timestamp;
    const memento = new ChapterActionMemento(newChapter, chapterConstants.CREATE_NEW_CHAPTER, timestamp);
    memento.create(user, isOffline);
};

export const update = (user: IReplayUser, chapter: Chapter, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new ChapterActionMemento(chapter, chapterConstants.UPDATE_CHAPTER, timestamp);
    memento.update(user, isOffline);
};

export const deleteEntity = (user: IReplayUser, chapter: Chapter, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new ChapterActionMemento(chapter, chapterConstants.DELETE_CHAPTER, timestamp);
    memento.deleteEntity(user, isOffline);
};

export const read = (user: IReplayUser, chapterId: number, isOffline = false) => {
    const timestamp = Date.now();
    const chapter = new Chapter();
    chapter.chapterId = chapterId;
    const memento = new ChapterActionMemento(chapter, chapterConstants.READ_CHAPTER, timestamp);
    memento.read(user, isOffline);
};

export const readAll = (user: IReplayUser, targetUserId: number, bookId: number, bookClientId: UUID, lastReadAll: Date, isOffline = false) => {
    const timestamp = Date.now();
    const dummyChapter = new Chapter();
    dummyChapter.userId = targetUserId;
    dummyChapter.bookId = bookId;
    dummyChapter.bookClientId = bookClientId;
    const memento = new ChapterActionMemento(dummyChapter, chapterConstants.READ_ALL_CHAPTERS, timestamp, lastReadAll.toISOString());
    memento.readAll(user, isOffline);
};
