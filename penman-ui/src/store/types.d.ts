// import { ThunkAction } from 'redux-thunk';

/**
 * RootReducer
 */

export interface IRootState {
    auth: IAuthenticationState,
    welcome: IWelcomeState,
    book: IBookState,
};


/**
 * AuthReducer
 */

export interface IAuthenticatedUser {
	token: string;
	refreshToken: string;
	tokenExpirationDate: Date;
	refreshTokenExpirationDate: Date;
	authorId: number;
	username: string;
	email: string;
	firstName: string;
	middleName: string;
	lastName: string;
	createdDate: Date;
	modifiedDate: Date;
};

export interface IAuthenticationErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IAuthenticationState {
    authenticatedUser: IAuthenticatedUser | null;
    authErrorState: IAuthenticationErrorState;
    pendingActions: IAuthReducerAction[];
};

export interface IAuthReducerAction {
    timestamp: number;
    type: string;
    payload?: any;
    error?: IAuthenticationErrorState;
};


/**
 * AuthActions
 */

export interface IAuthCredentials {
    username: string;
    password: string;
};


/**
 * WelcomeReducer
 */

export interface IWelcomeErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IWelcomeState {
    welcomeErrorState: IWelcomeErrorState;
};

export interface IWelcomeReducerAction {
    type: string;
    payload?: any;
    error?: IWelcomeErrorState;
};


/**
 * WelcomeActions
 */

export interface ILeadEmail {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message: string;
    callbackDate: Date;
};



/**
 * BookReducer
 */

export interface IBook {
    bookId: number;
    authorId: number;
    timelineId?: number;
    title: string;
    createdDate: Date;
    modifiedDate: Date;
};

export interface IBookCollection {
    books: IBook[];
};

export interface IBookErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IBookState {
    books: Record<number, IBook | undefined>;
    bookErrorState: IBookErrorState;
    pendingActions: IBookReducerAction[];
};

export interface IBookReducerAction {
    timestamp: number;
    type: string;
    payload?: any;
    error?: IBookErrorState;
};



/**
 * BookActions
 */

//



/**
 * Forms
 */

export interface INewUser {
	username: string;
	email: string;
	firstName: string;
	middleName: string;
	lastName: string;
};

export interface INewBook {
    authorId: number;
    timelineId?: number;
    title: string;
}

