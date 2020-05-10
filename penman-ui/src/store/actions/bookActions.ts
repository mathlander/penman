import axios, { AxiosRequestConfig } from 'axios';
import { apiConstants, bookConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IBook, IBookCollection, IBookErrorState, INewBook } from '../types';

export const create = (authUser: IAuthenticatedUser, newBook: INewBook, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.booksController}/create`;
            const data = newBook;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: bookConstants.CREATE_NEW_BOOK, payload: newBook, timestamp, suppressTimeoutAlert, memento });
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const bookResponseDto: IBook = response.data;
                bookResponseDto.createdDate = new Date(response.data.createdDate);
                bookResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: bookConstants.CREATE_NEW_BOOK_SUCCESS, payload: bookResponseDto, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IBookErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: bookConstants.CREATE_NEW_BOOK_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IBookErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to register the new book record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: bookConstants.CREATE_NEW_BOOK_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.booksController}/readall?authorId=${authUser.authorId}&lastReadAll=${lastReadAll.toISOString()}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: bookConstants.READ_ALL_BOOKS, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readAllResponseDto: IBookCollection = response.data;
                readAllResponseDto.books.forEach((book, idx) => {
                    book.createdDate = new Date(response.data.books[idx].createdDate);
                    book.modifiedDate = new Date(response.data.books[idx].modifiedDate);
                });
                dispatch({ type: bookConstants.READ_ALL_BOOKS_SUCCESS, payload: readAllResponseDto, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IBookErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: bookConstants.READ_ALL_BOOKS_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IBookErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all book records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: bookConstants.READ_ALL_BOOKS_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const read = (authUser: IAuthenticatedUser, bookId: number, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.booksController}/read?authorId=${authUser.authorId}&bookId=${bookId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: bookConstants.READ_BOOK, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readResponseDto: IBook = response.data;
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: bookConstants.READ_BOOK_SUCCESS, payload: readResponseDto, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IBookErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: bookConstants.READ_BOOK_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IBookErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all book records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: bookConstants.READ_BOOK_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const update = (authUser: IAuthenticatedUser, book: IBook, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.booksController}/update`;
            const data = book;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: bookConstants.UPDATE_BOOK, payload: book, timestamp, suppressTimeoutAlert, memento });
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                const updateResponseDto: IBook = response.data;
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: bookConstants.UPDATE_BOOK_SUCCESS, payload: updateResponseDto, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IBookErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: bookConstants.UPDATE_BOOK_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IBookErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to update the specified book record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: bookConstants.UPDATE_BOOK_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, book: IBook, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.booksController}/delete?authorId=${authUser.authorId}&bookId=${book.bookId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: bookConstants.DELETE_BOOK, payload: book, timestamp, suppressTimeoutAlert, memento });
            axios.delete(
                url,
                config
            ).then(() => {
                dispatch({ type: bookConstants.DELETE_BOOK_SUCCESS, timestamp, suppressTimeoutAlert, memento });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IBookErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: bookConstants.DELETE_BOOK_TIMEOUT, error, timestamp, suppressTimeoutAlert, memento });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert, memento });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IBookErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to delete the specified book record from the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: bookConstants.DELETE_BOOK_ERROR, error, timestamp, suppressTimeoutAlert, memento });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

