import axios from 'axios';
import { apiConstants, bookConstants } from '../../config/constants';
import { IAuthenticatedUser, IBook, IBookCollection, IBookErrorState, INewBook } from '../types';

export const create = (authUser: IAuthenticatedUser, newBook: INewBook) => {
    return (dispatch: any) => {
        const url = `${apiConstants.booksController}/create`;
        const data = newBook;
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
                const bookResponseDto: IBook = response.data;
                bookResponseDto.createdDate = new Date(response.data.createdDate);
                bookResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: bookConstants.CREATE_NEW_BOOK_SUCCESS, payload: bookResponseDto, timestamp });
            }).catch((err) => {
                const error: IBookErrorState = {
                    internalErrorMessage: `Received the following error while attempting to register the new book record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: bookConstants.CREATE_NEW_BOOK_ERROR, error, timestamp });
            });
        };
        dispatch({ type: bookConstants.CREATE_NEW_BOOK, payload: newBook, timestamp, memento });
        memento();
    };
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date) => {
    return (dispatch: any) => {
        const url = `${apiConstants.booksController}/readall?authorId=${authUser.authorId}&lastReadAll=${lastReadAll.toISOString()}`;
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
                const readAllResponseDto: IBookCollection = response.data;
                readAllResponseDto.books.forEach((book, idx) => {
                    book.createdDate = new Date(response.data.books[idx].createdDate);
                    book.modifiedDate = new Date(response.data.books[idx].modifiedDate);
                });
                dispatch({ type: bookConstants.READ_ALL_BOOKS_SUCCESS, payload: readAllResponseDto, timestamp });
            }).catch((err) => {
                const error: IBookErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all book records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: bookConstants.READ_ALL_BOOKS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: bookConstants.READ_ALL_BOOKS, timestamp, memento });
        memento();
    };
};

export const read = (authUser: IAuthenticatedUser, bookId: number) => {
    return (dispatch: any) => {
        const url = `${apiConstants.booksController}/read?authorId=${authUser.authorId}&bookId=${bookId}`;
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
                const readResponseDto: IBook = response.data;
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: bookConstants.READ_BOOK_SUCCESS, payload: readResponseDto, timestamp });
            }).catch((err) => {
                const error: IBookErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all book records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: bookConstants.READ_ALL_BOOKS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: bookConstants.READ_ALL_BOOKS, timestamp, memento });
        memento();
    };
};

export const update = (authUser: IAuthenticatedUser, book: IBook) => {
    return (dispatch: any) => {
        const url = `${apiConstants.booksController}/update`;
        const data = book;
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
                const updateResponseDto: IBook = response.data;
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: bookConstants.UPDATE_BOOK_SUCCESS, payload: updateResponseDto, timestamp });
            }).catch((err) => {
                const error: IBookErrorState = {
                    internalErrorMessage: `Received the following error while attempting to update the specified book record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: bookConstants.UPDATE_BOOK_ERROR, error, timestamp });
            });
        };
        dispatch({ type: bookConstants.UPDATE_BOOK, timestamp, memento });
        memento();
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, book: IBook) => {
    return (dispatch: any) => {
        const url = `${apiConstants.booksController}/delete?authorId=${authUser.authorId}&bookId=${book.bookId}`;
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
                dispatch({ type: bookConstants.DELETE_BOOK_SUCCESS, timestamp });
            }).catch((err) => {
                const error: IBookErrorState = {
                    internalErrorMessage: `Received the following error while attempting to delete the specified book record from the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: bookConstants.DELETE_BOOK_ERROR, error, timestamp });
            });
        };
        dispatch({ type: bookConstants.DELETE_BOOK, timestamp, memento });
        memento();
    };
};

