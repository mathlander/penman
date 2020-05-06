import axios from 'axios';
import { apiConstants, chapterConstants } from '../../config/constants';
import { IAuthenticatedUser, IChapter, IChapterCollection, IChapterErrorState, INewChapter } from '../types';

export const create = (authUser: IAuthenticatedUser, newChapter: INewChapter) => {
    return (dispatch: any) => {
        const url = `${apiConstants.chaptersController}/create`;
        const data = newChapter;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const chapterResponseDto: IChapter = response.data;
                chapterResponseDto.createdDate = new Date(response.data.createdDate);
                chapterResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_SUCCESS, payload: chapterResponseDto, timestamp });
            }).catch((err) => {
                const error: IChapterErrorState = {
                    internalErrorMessage: `Received the following error while attempting to register the new chapter record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER_ERROR, error, timestamp });
            });
        };
        dispatch({ type: chapterConstants.CREATE_NEW_CHAPTER, payload: newChapter, timestamp, memento });
        memento();
    };
};

export const readAll = (authUser: IAuthenticatedUser, bookId: number) => {
    return (dispatch: any) => {
        const url = `${apiConstants.chaptersController}/readall?authorId=${authUser.authorId}&bookId=${bookId}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.get(
                url,
                config
            ).then((response) => {
                const readAllResponseDto: IChapterCollection = response.data;
                readAllResponseDto.chapters.forEach((chapter, idx) => {
                    chapter.createdDate = new Date(response.data.chapters[idx].createdDate);
                    chapter.modifiedDate = new Date(response.data.chapters[idx].modifiedDate);
                });
                dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_SUCCESS, payload: readAllResponseDto, timestamp });
            }).catch((err) => {
                const error: IChapterErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all chapter records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: chapterConstants.READ_ALL_CHAPTERS, timestamp, memento });
        memento();
    };
};

export const read = (authUser: IAuthenticatedUser, chapterId: number) => {
    return (dispatch: any) => {
        const url = `${apiConstants.chaptersController}/read?chapterId=${chapterId}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.get(
                url,
                config
            ).then((response) => {
                const readResponseDto: IChapter = response.data;
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: readResponseDto, timestamp });
            }).catch((err) => {
                const error: IChapterErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all chapter records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: chapterConstants.READ_ALL_CHAPTERS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: chapterConstants.READ_ALL_CHAPTERS, timestamp, memento });
        memento();
    };
};

export const update = (authUser: IAuthenticatedUser, chapter: IChapter) => {
    return (dispatch: any) => {
        const url = `${apiConstants.chaptersController}/update`;
        const data = chapter;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                const updateResponseDto: IChapter = response.data;
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: chapterConstants.UPDATE_CHAPTER_SUCCESS, payload: updateResponseDto, timestamp });
            }).catch((err) => {
                const error: IChapterErrorState = {
                    internalErrorMessage: `Received the following error while attempting to update the specified chapter record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: chapterConstants.UPDATE_CHAPTER_ERROR, error, timestamp });
            });
        };
        dispatch({ type: chapterConstants.UPDATE_CHAPTER, timestamp, memento });
        memento();
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, chapter: IChapter) => {
    return (dispatch: any) => {
        const url = `${apiConstants.chaptersController}/delete?authorId=${authUser.authorId}&chapterId=${chapter.chapterId}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.delete(
                url,
                config
            ).then(() => {
                dispatch({ type: chapterConstants.DELETE_CHAPTER_SUCCESS, timestamp });
            }).catch((err) => {
                const error: IChapterErrorState = {
                    internalErrorMessage: `Received the following error while attempting to delete the specified chapter record from the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: chapterConstants.DELETE_CHAPTER_ERROR, error, timestamp });
            });
        };
        dispatch({ type: chapterConstants.DELETE_CHAPTER, timestamp, memento });
        memento();
    };
};

