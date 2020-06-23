import { bookConstants } from '../../constants';
import { Book, IBookState, IBookAction, nullError, apiUnreachableError, defaultBookState, UUID } from '../types';
import { BookActionMemento } from '../actions/bookActions';
import { deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { ErrorCodes } from '../type-defs/error-types';

const readLocalStorage = (): IBookState => {
    let fromStorage = localStorage.getItem(bookConstants.BOOK_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Book> = {};
    return Object.assign(
        {},
        defaultBookState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => BookActionMemento.hydrate(memento));
            } else if (key === 'books') {
                const bookRecords: Record<number, Book> = value.reduce((map: Record<number, Book>, serializedObject: string) => {
                    const book = Book.fromSerializedJSON(serializedObject);
                    uuidLookup[book.clientId] = book;
                    map[book.bookId] = book;
                    return map;
                }, {});
                return bookRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.bookErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IBookState): void => {
    localStorage.setItem(bookConstants.BOOK_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        books: Object.values(state.books).map(book => book.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};

const initState: IBookState = readLocalStorage();

const bookReducer = (state: IBookState = initState, action: IBookAction): IBookState => {
    let nextState = state;
    switch (action.type) {
        case bookConstants.BOOK_CLEAR_ERROR:
            nextState = {
                ...state,
                bookErrorState: nullError,
            };
            return nextState;
        case bookConstants.CANCEL_BOOK_ACTION:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.CREATE_NEW_BOOK:
            const pendingNewBook: Book = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingNewBook.clientId]: pendingNewBook,
                },
                books: {
                    ...state.books,
                    [-action.timestamp]: pendingNewBook,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.CREATE_NEW_BOOK_ERROR:
            const failedNewBook: Book = action.payload;
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to create the specified book definition.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new book to the API.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.books[-action.timestamp];
            delete nextState.uuidLookup[failedNewBook.clientId];
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.CREATE_NEW_BOOK_SUCCESS:
            const newBook: Book = action.payload;
            nextState = {
                ...state,
                books: {
                    ...state.books,
                    [newBook.bookId]: newBook,
                },
                bookErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.books[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.CREATE_NEW_BOOK_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.UPDATE_BOOK:
            const pendingUpdatedBook: Book = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingUpdatedBook.clientId]: pendingUpdatedBook,
                },
                books: {
                    ...state.books,
                    [pendingUpdatedBook.bookId]: pendingUpdatedBook,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.UPDATE_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to update the specified book.',
                    internalErrorMessage: 'The API returned an error while attempting to update the specified book.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case bookConstants.UPDATE_BOOK_SUCCESS:
            const updatedBook: Book = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [updatedBook.clientId]: updatedBook,
                },
                books: {
                    ...state.books,
                    [updatedBook.bookId]: updatedBook,
                },
                bookErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.UPDATE_BOOK_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.DELETE_BOOK:
            const deletedBook: Book = action.payload;
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            delete nextState.uuidLookup[deletedBook.clientId];
            delete nextState.books[deletedBook.bookId];
            delete nextState.books[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.DELETE_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to delete this book.',
                    internalErrorMessage: 'The API returned an error while attempting to delete the book.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case bookConstants.DELETE_BOOK_SUCCESS:
            nextState = {
                ...state,
                bookErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case bookConstants.DELETE_BOOK_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.READ_BOOK:
            // const readingBook: Book = action.payload;
            nextState = {
                ...state,
                // books: {
                //     ...state.books,
                //     [readingBook.bookId]: readingBook,
                // },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified book',
                    internalErrorMessage: 'The API returned an error while attempting to read the specified book.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_BOOK_SUCCESS:
            const retrievedBook: Book = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [retrievedBook.clientId]: retrievedBook,
                },
                books: {
                    ...state.books,
                    [retrievedBook.bookId]: retrievedBook,
                },
                bookErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_BOOK_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.READ_ALL_BOOKS:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_ALL_BOOKS_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified book collection.',
                    internalErrorMessage: 'The API returned an error while attempting to read all books for the given author.',
                    errorCode: ErrorCodes.apiUnreachable,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_ALL_BOOKS_SUCCESS:
            // may want to create another lookup by userId (action.payload.targetUserId)
            nextState = {
                ...state,
                bookErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.payload.authenticatedUserId === action.payload.targetUserId) nextState.lastReadAll = action.payload.lastReadAll;
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_ALL_BOOKS_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
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

export default bookReducer;
