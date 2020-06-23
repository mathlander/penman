import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, offlineConstants, bookConstants, chapterConstants } from '../../constants';
import { IReplayableAction, Book, Chapter, IReplayUser, IError, ErrorCodes, IClientBook, IClientChapter, IBookCollection, nullError } from '../types';

export class BookActionMemento implements IReplayableAction {
    public book: Book;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string;
    public serializedData: string;

    constructor(book: Book, type: string, timestamp: number, lastReadAllISOString = '') {
        this.book = book;
        this.type = type;
        this.timestamp = timestamp;
        this.lastReadAllISOString = lastReadAllISOString;
        this.serializedData = BookActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'book') return Book.fromSerializedJSON(value);
            else return value;
        });
        return new BookActionMemento(restoredMemento.book, restoredMemento.type, restoredMemento.timestamp, restoredMemento.lastReadAllISOString);
    }

    static dehydrate(actionMemento: BookActionMemento) {
        const serializedMemento = JSON.stringify({
            book: actionMemento.book.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAllISOString: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user: IReplayUser, isOffline: boolean) {
        switch (this.type) {
            case bookConstants.CREATE_NEW_BOOK:
                this.create(user, isOffline, true);
                break;
            case bookConstants.UPDATE_BOOK:
                this.update(user, isOffline, true);
                break;
            case bookConstants.DELETE_BOOK:
                this.deleteEntity(user, isOffline, true);
                break;
            case bookConstants.READ_BOOK:
                this.read(user, isOffline, true);
                break;
            case bookConstants.READ_ALL_BOOKS:
                this.readAll(user, isOffline, true);
                break;
            default:
                break;
        }
    }

    public create(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/create`;
        const data = this.book.toCreateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.CREATE_NEW_BOOK, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: bookConstants.CREATE_NEW_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.post(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientBook>) => {
            this.book.onApiProcessed(response.data, true);
            dispatch({ type: bookConstants.CREATE_NEW_BOOK_SUCCESS, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: bookConstants.CREATE_NEW_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                // dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp })
            } else if (err.response && err.response.data && err.response.data.errorCode === ErrorCodes.clientIdCollided) {
                // suppress the error and any state change, just resolve the collision and try again
                this.book.handleIdCollision();
                this.create(user, isOffline);
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the new book: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: bookConstants.CREATE_NEW_BOOK_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public update(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/update`;
        const data = this.book.toUpdateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.UPDATE_BOOK, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: bookConstants.UPDATE_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.patch(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientBook>) => {
            this.book.onApiProcessed(response.data, true);
            dispatch({ type: bookConstants.UPDATE_BOOK_SUCCESS, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: bookConstants.UPDATE_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the book record: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: bookConstants.UPDATE_BOOK_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public deleteEntity(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/delete?userId=${user.userId}&bookId=${this.book.bookId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.DELETE_BOOK, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: bookConstants.DELETE_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: bookConstants.DELETE_BOOK_SUCCESS, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: bookConstants.DELETE_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to delete the specified book: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: bookConstants.DELETE_BOOK_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public read(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/read?userId=${user.userId}&bookId=${this.book.bookId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.READ_BOOK, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: bookConstants.READ_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IClientBook>) => {
            this.book.onApiProcessed(response.data);
            const chapterCollection: any = response.data.chapters || null;
            if (chapterCollection !== null) {
                chapterCollection.forEach((chapterDto: IClientChapter) => {
                    const chapter = new Chapter(chapterDto);
                    dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                });
            }
            dispatch({ type: bookConstants.READ_BOOK_SUCCESS, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: bookConstants.READ_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to read the specified book: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: bookConstants.READ_BOOK_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public readAll(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/readall?userId=${this.book.userId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.READ_ALL_BOOKS, payload: { authenticatedUserId: user.userId, targetUserId: this.book.userId, lastReadAll: this.lastReadAllISOString}, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: bookConstants.READ_ALL_BOOKS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IBookCollection>) => {
            const lastReadAll = new Date(response.data.lastReadAll);
            const bookCollection = response.data.books;
            bookCollection.forEach((bookDto, idx) => {
                const book = new Book(bookDto);
                const chapterCollection: any = response.data.books[idx].chapters || null;
                if (chapterCollection !== null) {
                    chapterCollection.forEach((chapterDto: IClientChapter) => {
                        const chapter = new Chapter(chapterDto);
                        dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                    });
                }
                dispatch({ type: bookConstants.READ_BOOK_SUCCESS, payload: book, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            });
            dispatch({ type: bookConstants.READ_ALL_BOOKS_SUCCESS, payload: { authenticatedUserId: user.userId, targetUserId: this.book.userId, lastReadAll }, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: bookConstants.READ_ALL_BOOKS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to read all books by the specified author.`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: bookConstants.READ_ALL_BOOKS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }
}

export const create = (user: IReplayUser, newBook: Book, isOffline = false) => {
    const timestamp = Date.now();
    // assign a unique id that distinguishes it from what the API will assign (positive valued int)
    newBook.bookId = -timestamp;
    const memento = new BookActionMemento(newBook, bookConstants.CREATE_NEW_BOOK, timestamp);
    memento.create(user, isOffline);
};

export const update = (user: IReplayUser, book: Book, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new BookActionMemento(book, bookConstants.UPDATE_BOOK, timestamp);
    memento.update(user, isOffline);
};

export const deleteEntity = (user: IReplayUser, book: Book, isOffline = false) => {
    const timestamp = Date.now();
    book.isDeleted = true;
    book.modifiedDate = new Date(timestamp);
    const memento = new BookActionMemento(book, bookConstants.DELETE_BOOK, timestamp);
    memento.deleteEntity(user, isOffline);
};

export const read = (user: IReplayUser, bookId: number, isOffline = false) => {
    const timestamp = Date.now();
    const book = new Book();
    book.bookId = bookId;
    const memento = new BookActionMemento(book, bookConstants.READ_BOOK, timestamp);
    memento.read(user, isOffline);
};

export const readAll = (user: IReplayUser, targetUserId: number, lastReadAll: Date, isOffline = false) => {
    const timestamp = Date.now();
    const dummyBook = new Book();
    dummyBook.userId = targetUserId;
    const memento = new BookActionMemento(dummyBook, bookConstants.READ_ALL_BOOKS, timestamp, lastReadAll.toISOString());
    memento.readAll(user, isOffline);
};
