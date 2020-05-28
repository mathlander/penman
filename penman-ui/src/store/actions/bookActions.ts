import axios, { AxiosRequestConfig } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, bookConstants, chapterConstants, timelineConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IBook, IBookErrorState, Book, IChapter, Chapter, ITimeline, Timeline, restoreOfflineWorkItemFromJSON, IReplayableAction } from '../types';

export class BookActionMemento implements IReplayableAction {
    public book: Book;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string = '';
    public serializedData: string;

    constructor(book: Book, type: string, timestamp: number) {
        this.book = book;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = BookActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'book') return restoreOfflineWorkItemFromJSON<Book>(value, Book);
            else return value;
        });
        const bookMemento = new BookActionMemento(restoredMemento.book, restoredMemento.type, restoredMemento.timestamp);
        bookMemento.lastReadAllISOString = restoredMemento.lastReadAllISOString || '';
        bookMemento.serializedData = memento;
        return bookMemento;
    }

    static dehydrate(actionMemento: BookActionMemento) {
        const serializedMemento = JSON.stringify({
            book: actionMemento.book.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAll: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user:IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        switch(this.type) {
            case bookConstants.CREATE_NEW_BOOK:
                this.create(user, suppressTimeoutAlert);
                break;
            case bookConstants.UPDATE_BOOK:
                this.update(user, suppressTimeoutAlert);
                break;
            case bookConstants.DELETE_BOOK:
                this.deleteEntity(user, suppressTimeoutAlert);
                break;
            case bookConstants.READ_BOOK:
                this.read(user, suppressTimeoutAlert);
                break;
            case bookConstants.READ_ALL_BOOKS:
                this.readAll(user, suppressTimeoutAlert);
                break;
            default:
                break;
        }
    }

    public create(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/create`;
        const data = this.book;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.CREATE_NEW_BOOK, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            this.book.onApiProcessed(response.data);
            dispatch({ type: bookConstants.CREATE_NEW_BOOK_SUCCESS, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IBookErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: bookConstants.CREATE_NEW_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IBookErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to register the new book record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: bookConstants.CREATE_NEW_BOOK_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public update(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/update`;
        const data = this.book;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.UPDATE_BOOK, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.patch(
            url,
            data,
            config
        ).then((response) => {
            this.book.onApiProcessed(response.data);
            const chapterCollection: IChapter[] | null = response.data.chapters;
            if (chapterCollection !== null) {
                chapterCollection.forEach((chapterDto, chapIdx) => {
                    const chapter = new Chapter(chapterDto);
                    const timelineDto: ITimeline | null = response.data.chapters[chapIdx].timeline;
                    if (timelineDto !== null) {
                        const timeline = new Timeline(timelineDto);
                        chapter.timeline = timeline;
                        chapter.timelineClientId = timeline.clientId;
                        dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                    }
                    dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                });
            }
            dispatch({ type: bookConstants.UPDATE_BOOK_SUCCESS, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IBookErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: bookConstants.UPDATE_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IBookErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to update the specified book record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: bookConstants.UPDATE_BOOK_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public deleteEntity(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/delete?authorId=${user.authorId}&bookId=${this.book.bookId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.DELETE_BOOK, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: bookConstants.DELETE_BOOK_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IBookErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: bookConstants.DELETE_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IBookErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to delete the specified book record from the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: bookConstants.DELETE_BOOK_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public read(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/read?authorId=${user.authorId}&bookId=${this.book.bookId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.READ_BOOK, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            this.book.onApiProcessed(response.data);
            const chapterCollection: IChapter[] | null = response.data.chapters;
            if (chapterCollection !== null) {
                const chapters: Chapter[] = [];
                chapterCollection.forEach((chapterDto, chapIdx) => {
                    const chapter = new Chapter(chapterDto);
                    const timelineDto: ITimeline | null = response.data.chapters[chapIdx].timeline;
                    if (timelineDto !== null) {
                        const timeline = new Timeline(timelineDto);
                        chapter.timeline = timeline;
                        chapter.timelineClientId = timeline.clientId;
                        dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                    }
                    chapters.push(chapter);
                    dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                });
                // book.chapters = chapters;
            }
            dispatch({ type: bookConstants.READ_BOOK_SUCCESS, payload: this.book, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IBookErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: bookConstants.READ_BOOK_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IBookErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all book records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: bookConstants.READ_BOOK_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public readAll(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.booksController}/readall?authorId=${user.authorId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: bookConstants.READ_ALL_BOOKS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const bookCollection: IBook[] = response.data.books;
            const books: Book[] = [];
            bookCollection.forEach((bookDto, idx) => {
                const book = new Book(bookDto);
                const chapterCollection: IChapter[] | null = response.data.books[idx].chapters;
                if (chapterCollection !== null) {
                    const chapters: Chapter[] = [];
                    chapterCollection.forEach((chapterDto, chapIdx) => {
                        const chapter = new Chapter(chapterDto);
                        const timelineDto: ITimeline | null = response.data.books[idx].chapters[chapIdx].timeline;
                        if (timelineDto !== null) {
                            const timeline = new Timeline(timelineDto);
                            chapter.timeline = timeline;
                            chapter.timelineClientId = timeline.clientId;
                            dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                        }
                        chapters.push(chapter);
                        dispatch({ type: chapterConstants.READ_CHAPTER_SUCCESS, payload: chapter, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                    });
                    // uncomment if chapters: Chapter[] is added as a property to Book
                    // for now, they're accessed via a lookup function
                    // book.chapters = chapters;
                }
                books.push(book);
            });
            dispatch({ type: bookConstants.READ_ALL_BOOKS_SUCCESS, payload: books, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IBookErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: bookConstants.READ_ALL_BOOKS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IBookErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all book records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: bookConstants.READ_ALL_BOOKS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }
}

export const create = (authUser: IAuthenticatedUser, newBook: Book, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    // placeholder id so that it is serialized and deserialized properly while in offline mode
    newBook.bookId = -timestamp;
    const memento = new BookActionMemento(newBook, bookConstants.CREATE_NEW_BOOK, timestamp);
    memento.create(authUser, suppressTimeoutAlert);
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const dummyBook = new Book();
    const memento = new BookActionMemento(dummyBook, bookConstants.READ_ALL_BOOKS, timestamp);
    memento.lastReadAllISOString = lastReadAll.toISOString();
    memento.serializedData = BookActionMemento.dehydrate(memento);
    memento.readAll(authUser, suppressTimeoutAlert);
};

export const read = (authUser: IAuthenticatedUser, bookId: number, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const book = new Book();
    book.bookId = bookId;
    const memento = new BookActionMemento(book, bookConstants.READ_BOOK, timestamp);
    memento.read(authUser, suppressTimeoutAlert);
};

export const update = (authUser: IAuthenticatedUser, book: Book, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new BookActionMemento(book, bookConstants.UPDATE_BOOK, timestamp);
    memento.update(authUser, suppressTimeoutAlert);
};

export const deleteEntity = (authUser: IAuthenticatedUser, book: Book, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new BookActionMemento(book, bookConstants.DELETE_BOOK, timestamp);
    memento.deleteEntity(authUser, suppressTimeoutAlert);
};

