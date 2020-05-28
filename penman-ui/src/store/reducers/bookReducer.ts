import { bookConstants, offlineConstants } from '../../config/constants';
import { Book, IBookState, IBookErrorState, IBookReducerAction, restoreOfflineWorkItemFromJSON, UUID } from '../types';
import { defaultDate } from '../../config/constants';
import { BookActionMemento } from '../actions/bookActions';

const nullErrorState: IBookErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IBookState => {
    let clientIdLookup: Record<UUID, Book> = {};
    let localStorageState: IBookState = JSON.parse(localStorage.getItem(bookConstants.BOOK_LOCAL_STORAGE_KEY) || 'null', (key, value) => {
        if (key === 'pendingActions' || key === 'offlineActionQueue') {
            return value.map((memento: string) => BookActionMemento.hydrate(memento));
        } else if (key === 'books') {
            const bookRecords: Record<number, Book> = value.reduce((map: Record<number, Book>, serializedObj: string) => {
                const book = restoreOfflineWorkItemFromJSON<Book>(serializedObj, Book);
                clientIdLookup[book.clientId] = book;
                return map[book.bookId] = book;
            }, {});
            return bookRecords;
        } else if (key === '') {
            value.clientIdLookup = clientIdLookup;
        } else return value;
    }) || {
        clientIdLookup: {},
        books: {},
        bookErrorState: nullErrorState,
        pendingActions: [],
        offlineActionQueue: [],
        lastReadAll: defaultDate,
    };
    localStorageState.lastReadAll = (localStorageState.lastReadAll && new Date(localStorageState.lastReadAll)) || defaultDate;
    return localStorageState;
};

const updateLocalStorage = (state: IBookState) : void => {
    localStorage.setItem(bookConstants.BOOK_LOCAL_STORAGE_KEY, JSON.stringify({
        books: Object.values(state.books).map(book => book.toSerializedJSON()),
        bookErrorState: nullErrorState,
        pendingActions: state.pendingActions.map(actionMemento => actionMemento.serializedData),
        offlineActionQueue: state.offlineActionQueue.map(actionMemento => actionMemento.serializedData),
        lastReadAll: (state.lastReadAll && state.lastReadAll.toISOString()) || defaultDate.toISOString(),
    }));
};

const initState: IBookState = readLocalStorage();

const bookReducer = (state: IBookState = initState, action: IBookReducerAction): IBookState => {
    let nextState = initState;
    switch (action.type) {
        case bookConstants.BOOK_CLEAR_ERROR:
            nextState = {
                ...state,
                bookErrorState: nullErrorState,
            };
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.CREATE_NEW_BOOK:
            const pendingNewBook: Book = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingNewBook.clientId]: pendingNewBook,
                },
                books: {
                    ...state.books,
                    [-action.timestamp]: pendingNewBook,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.CREATE_NEW_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new book to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified book definition.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
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
                bookErrorState: nullErrorState,
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
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
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
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            delete nextState.clientIdLookup[deletedBook.clientId];
            delete nextState.books[deletedBook.bookId];
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.DELETE_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to delete the book.',
                    displayErrorMessage: 'An error occurred while attempting to delete this book.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.DELETE_BOOK_SUCCESS:
            nextState = {
                ...state,
                bookErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.DELETE_BOOK_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.READ_ALL_BOOKS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_ALL_BOOKS_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all books for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the book collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_ALL_BOOKS_SUCCESS:
            const books: Book[] = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                },
                books: {
                    ...state.books,
                },
                bookErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                lastReadAll: new Date(action.timestamp),
            };
            books.forEach(book => {
                const cachedBook: Book | null = nextState.books[book.bookId] || null;
                if (!cachedBook || cachedBook.modifiedDate.getTime() < book.modifiedDate.getTime()) {
                    nextState.clientIdLookup[book.clientId] = book;
                    nextState.books[book.bookId] = book;
                }
            });
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_ALL_BOOKS_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.READ_BOOK:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all books for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the book collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_BOOK_SUCCESS:
            const retrievedBook: Book = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [retrievedBook.clientId]: retrievedBook,
                },
                books: {
                    ...state.books,
                    [retrievedBook.bookId]: retrievedBook,
                },
                bookErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_BOOK_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
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
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [pendingUpdatedBook.clientId]: pendingUpdatedBook,
                },
                books: {
                    ...state.books,
                    [pendingUpdatedBook.bookId]: pendingUpdatedBook,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.UPDATE_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all books for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the book collection.',
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.UPDATE_BOOK_SUCCESS:
            const updatedBook: Book = action.payload;
            nextState = {
                ...state,
                clientIdLookup: {
                    ...state.clientIdLookup,
                    [updatedBook.clientId]: updatedBook,
                },
                books: {
                    ...state.books,
                    [updatedBook.bookId]: updatedBook,
                },
                bookErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.UPDATE_BOOK_TIMEOUT:
            nextState = {
                ...state,
                bookErrorState: action.suppressTimeoutAlert
                    ? state.bookErrorState
                    : action.error || {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
}

export default bookReducer;
