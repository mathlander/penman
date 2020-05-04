import { bookConstants } from '../../config/constants';
import { IBook, IBookCollection, IBookState, IBookErrorState, IBookReducerAction } from '../types';

const nullErrorState: IBookErrorState = {
    internalErrorMessage: null,
    displayErrorMessage: null,
};

const readLocalStorage = () : IBookState => {
    return JSON.parse(localStorage.getItem(bookConstants.BOOK_LOCAL_STORAGE_KEY) || 'null') || {
        books: {},
        bookErrorState: nullErrorState,
        pendingActions: [],
    };
};

const updateLocalStorage = (state: IBookState) : void => {
    localStorage.setItem(bookConstants.BOOK_LOCAL_STORAGE_KEY, JSON.stringify({
        books: state.books,
        bookErrorState: nullErrorState,
        pendingActions: state.pendingActions,
    }));
};

const initState: IBookState = readLocalStorage();

const bookReducer = (state: IBookState = initState, action: IBookReducerAction): IBookState => {
    let nextState = initState;
    switch (action.type) {
        case bookConstants.CREATE_NEW_BOOK:
            const pendingNewBook: IBook = action.payload;
            nextState = {
                ...state,
                books: {
                    ...state.books,
                    [-action.timestamp]: pendingNewBook,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.CREATE_NEW_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new book to the API.',
                    displayErrorMessage: 'An error occurred while attempting to create the specified book definition.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.CREATE_NEW_BOOK_SUCCESS:
            // consider persisting IBook objects in localStorage, they're light and rare (per author)
            const newBook: IBook = action.payload;
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

        case bookConstants.DELETE_BOOK:
            const deletedBook: IBook = action.payload;
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
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
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
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

        case bookConstants.READ_ALL_BOOKS:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_ALL_BOOKS_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all books for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the book collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_ALL_BOOKS_SUCCESS:
            const bookCollection: IBookCollection = action.payload;
            nextState = {
                ...state,
                books: {
                    ...state.books
                },
                bookErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            bookCollection.books.forEach(book => {
                nextState.books[book.bookId] = book;
            });
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.READ_BOOK:
            nextState = {
                ...state,
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all books for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the book collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.READ_BOOK_SUCCESS:
            const retrievedBook: IBook = action.payload;
            nextState = {
                ...state,
                books: {
                    ...state.books,
                    [retrievedBook.bookId]: retrievedBook,
                },
                bookErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case bookConstants.UPDATE_BOOK:
            const pendingUpdatedBook: IBook = action.payload;
            nextState = {
                ...state,
                books: {
                    ...state.books,
                    [pendingUpdatedBook.bookId]: pendingUpdatedBook,
                },
                // handle replayed actions
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp).concat(action),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.UPDATE_BOOK_ERROR:
            nextState = {
                ...state,
                bookErrorState: action.error || {
                    internalErrorMessage: 'The API returned an error while attempting to read all books for the current author.',
                    displayErrorMessage: 'An error occurred while attempting to retrieve the book collection.',
                },
                // pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case bookConstants.UPDATE_BOOK_SUCCESS:
            const updatedBook: IBook = action.payload;
            nextState = {
                ...state,
                books: {
                    ...state.books,
                    [updatedBook.bookId]: updatedBook,
                },
                bookErrorState: nullErrorState,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
}

export default bookReducer;
