import axios, { AxiosRequestConfig } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, chapterConstants, timelineConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IChapter, IChapterErrorState, Chapter, mementoNoOp, Timeline, IReplayableAction, restoreOfflineWorkItemFromJSON } from '../types';

export class ChapterActionMemento implements IReplayableAction {
    public chapter: Chapter;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string = '';
    public serializedData: string;

    constructor(chapter: Chapter, type: string, timestamp: number) {
        this.chapter = chapter;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = ChapterActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'chapter') return restoreOfflineWorkItemFromJSON<Chapter>(value, Chapter);
            else return value;
        });
        const chapterMemento = new ChapterActionMemento(restoredMemento.chapter, restoredMemento.type, restoredMemento.timestamp);
        chapterMemento.lastReadAllISOString = restoredMemento.lastReadAllISOString || '';
        chapterMemento.serializedData = memento;
        return chapterMemento;
    }

    static dehydrate(actionMemento: ChapterActionMemento) {
        const serializedMemento = JSON.stringify({
            chapter: actionMemento.chapter.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAll: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user:IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        switch(this.type) {
            case chapterConstants.CREATE_NEW_CHAPTER:
                this.create(user, suppressTimeoutAlert);
                break;
            case chapterConstants.UPDATE_CHAPTER:
                this.update(user, suppressTimeoutAlert);
                break;
            case chapterConstants.DELETE_CHAPTER:
                this.deleteEntity(user, suppressTimeoutAlert);
                break;
            case chapterConstants.READ_CHAPTER:
                this.read(user, suppressTimeoutAlert);
                break;
            case chapterConstants.READ_ALL_CHAPTERS:
                this.readAll(user, suppressTimeoutAlert);
                break;
            default:
                break;
        }
    }

    public create(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/create`;
        const data = this.chapter;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            this.chapter.onApiProcessed(response.data);
            dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_SUCCESS, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IChapterErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IChapterErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to register the new chapter record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public update(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/update`;
        const data = this.chapter;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.UPDATE_CHAPTER, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.patch(
            url,
            data,
            config
        ).then((response) => {
            this.chapter.onApiProcessed(response.data);
            // associated timelines are returned as part of the response object when not null
            // treat it as having been read from the timelines controller directly
            if (response.data.timeline) {
                const timeline = new Timeline(response.data.timeline);
                this.chapter.timeline = timeline;
                this.chapter.timelineClientId = timeline.clientId;
                dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
            dispatch({ type: chapterConstants.UPDATE_CHAPTER_SUCCESS, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IChapterErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: chapterConstants.UPDATE_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IChapterErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to update the specified chapter record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: chapterConstants.UPDATE_CHAPTER_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public deleteEntity(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/delete?authorId=${this.chapter.authorId}&chapterId=${this.chapter.chapterId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.DELETE_CHAPTER, payload: this.chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: chapterConstants.DELETE_CHAPTER_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IChapterErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: chapterConstants.DELETE_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IChapterErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to delete the specified chapter record from the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: chapterConstants.DELETE_CHAPTER_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public read(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/read?chapterId=${this.chapter.chapterId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.READ_CHAPTER, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const chapter = new Chapter(response.data);
            // associated timelines are returned as part of the response object when not null
            // treat it as having been read from the timelines controller directly
            if (response.data.timeline) {
                const timeline = new Timeline(response.data.timeline);
                chapter.timeline = timeline;
                chapter.timelineClientId = timeline.clientId;
                dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
            dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IChapterErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: chapterConstants.READ_CHAPTER_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IChapterErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all chapter records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: chapterConstants.READ_CHAPTER_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public readAll(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.chaptersController}/readall?authorId=${user.authorId}&bookId=${this.chapter.bookId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: chapterConstants.READ_ALL_CHAPTERS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const chapterDtoCollection: IChapter[] = response.data.chapters;
            const chapters: Chapter[] = [];
            chapterDtoCollection.forEach((chapterDto, idx) => {
                const chapter = new Chapter(chapterDto);
                // associated timelines are returned as part of the response object when not null
                // treat it as having been read from the timelines controller directly
                if (response.data.chapters[idx].timeline) {
                    const timeline = new Timeline(response.data.chapters[idx].timeline);
                    chapter.timeline = timeline;
                    chapter.timelineClientId = timeline.clientId;
                    dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                }
                chapters.push(chapter);
            });
            dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_SUCCESS, payload: chapters, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IChapterErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IChapterErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all chapter records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }
}

export const create = (authUser: IAuthenticatedUser, newChapter: Chapter, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    newChapter.chapterId = -timestamp;
    const memento = new ChapterActionMemento(newChapter, chapterConstants.CREATE_NEW_CHAPTER, timestamp);
    memento.create(authUser, suppressTimeoutAlert);
};

export const readAll = (authUser: IAuthenticatedUser, bookId: number, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const dummyChapter = new Chapter();
    dummyChapter.bookId = bookId;
    const memento = new ChapterActionMemento(dummyChapter, chapterConstants.READ_ALL_CHAPTERS, timestamp);
    // memento.serializedData = ChapterActionMemento.dehydrate(memento);
    memento.readAll(authUser, suppressTimeoutAlert);
};

export const read = (authUser: IAuthenticatedUser, chapterId: number, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const chapter = new Chapter();
    chapter.chapterId = chapterId;
    const memento = new ChapterActionMemento(chapter, chapterConstants.READ_CHAPTER, timestamp);
    memento.read(authUser, suppressTimeoutAlert);
};

export const update = (authUser: IAuthenticatedUser, chapter: Chapter, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new ChapterActionMemento(chapter, chapterConstants.UPDATE_CHAPTER, timestamp);
    memento.update(authUser, suppressTimeoutAlert)
};

export const deleteEntity = (authUser: IAuthenticatedUser, chapter: Chapter, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new ChapterActionMemento(chapter, chapterConstants.DELETE_CHAPTER, timestamp);
    memento.deleteEntity(authUser, suppressTimeoutAlert);
};

