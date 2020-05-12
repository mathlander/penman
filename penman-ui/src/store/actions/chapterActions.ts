import axios, { AxiosRequestConfig } from 'axios';
import { apiConstants, chapterConstants, timelineConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IChapter, IChapterCollection, IChapterErrorState, INewChapter, ITimeline, mementoNoOp } from '../types';

export const create = (authUser: IAuthenticatedUser, newChapter: INewChapter, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.chaptersController}/create`;
            const data = newChapter;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER, payload: newChapter, timestamp, suppressTimeoutAlert, memento });
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const chapterResponseDto: IChapter = response.data;
                chapterResponseDto.createdDate = new Date(response.data.createdDate);
                chapterResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_SUCCESS, payload: chapterResponseDto, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IChapterErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IChapterErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to register the new chapter record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const readAll = (authUser: IAuthenticatedUser, bookId: number, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.chaptersController}/readall?authorId=${authUser.authorId}&bookId=${bookId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: chapterConstants.READ_ALL_CHAPTERS, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readAllResponseDto: IChapterCollection = response.data;
                readAllResponseDto.chapters.forEach((chapter, idx) => {
                    chapter.createdDate = new Date(response.data.chapters[idx].createdDate);
                    chapter.modifiedDate = new Date(response.data.chapters[idx].modifiedDate);
                    // associated timelines are returned as part of the response object when not null
                    // treat it as having been read from the timelines controller directly
                    const timeline: ITimeline | null = response.data.chapters[idx].timeline;
                    if (timeline !== null) {
                        dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp, suppressTimeoutAlert, memento: mementoNoOp });
                    }
                });
                dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_SUCCESS, payload: readAllResponseDto, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IChapterErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IChapterErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all chapter records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const read = (authUser: IAuthenticatedUser, chapterId: number, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.chaptersController}/read?chapterId=${chapterId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: chapterConstants.READ_CHAPTER, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readResponseDto: IChapter = response.data;
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                // associated timelines are returned as part of the response object when not null
                // treat it as having been read from the timelines controller directly
                const timeline: ITimeline | null = response.data.timeline;
                if (timeline !== null) {
                    dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp, suppressTimeoutAlert, memento: mementoNoOp });
                }
                dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: readResponseDto, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IChapterErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: chapterConstants.READ_CHAPTER_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IChapterErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all chapter records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: chapterConstants.READ_CHAPTER_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const update = (authUser: IAuthenticatedUser, chapter: IChapter, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.chaptersController}/update`;
            const data = chapter;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: chapterConstants.UPDATE_CHAPTER, payload: chapter, timestamp, suppressTimeoutAlert, memento });
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                const updateResponseDto: IChapter = response.data;
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                // associated timelines are returned as part of the response object when not null
                // treat it as having been read from the timelines controller directly
                const timeline: ITimeline | null = response.data.timeline;
                if (timeline !== null) {
                    dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp, suppressTimeoutAlert, memento: mementoNoOp });
                }
                dispatch({ type: chapterConstants.UPDATE_CHAPTER_SUCCESS, payload: updateResponseDto, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IChapterErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: chapterConstants.UPDATE_CHAPTER_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IChapterErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to update the specified chapter record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: chapterConstants.UPDATE_CHAPTER_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, chapter: IChapter, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.chaptersController}/delete?authorId=${authUser.authorId}&chapterId=${chapter.chapterId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: chapterConstants.DELETE_CHAPTER, payload: chapter, timestamp, suppressTimeoutAlert, memento });
            axios.delete(
                url,
                config
            ).then(() => {
                dispatch({ type: chapterConstants.DELETE_CHAPTER_SUCCESS, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IChapterErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: chapterConstants.DELETE_CHAPTER_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IChapterErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to delete the specified chapter record from the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: chapterConstants.DELETE_CHAPTER_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

