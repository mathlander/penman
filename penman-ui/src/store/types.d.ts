// import { ThunkAction } from 'redux-thunk';

/**
 * RootReducer
 */

export interface IRootState {
    auth: IAuthenticationState;
    welcome: IWelcomeState;
    book: IBookState;
    chapter: IChapterState;
    personification: IPersonificationState;
    prompt: IPromptState;
    short: IShortState;
    timeline: ITimelineState;
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
    memento?: () => void;
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
    memento?: () => void;
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
    books: Record<number, IBook>;
    bookErrorState: IBookErrorState;
    pendingActions: IBookReducerAction[];
};

export interface IBookReducerAction {
    timestamp: number;
    type: string;
    payload?: any;
    error?: IBookErrorState;
    memento?: () => void;
};



/**
 * BookActions
 */

//



/**
 * ChapterReducer
 */

export interface IChapter {
    chapterId: number;
    bookId: number;
    authorId: number;
    timelineId?: number;
    title: string;
    sortOrder: number;
    createdDate: Date;
    modifiedDate: Date;
};

export interface IChapterCollection {
    chapters: IChapter[];
};

export interface IChapterErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IChapterState {
    chapters: Record<number, IChapter>;
    chapterErrorState: IChapterErrorState;
    pendingActions: IChapterReducerAction[];
};

export interface IChapterReducerAction {
    timestamp: number;
    type: string;
    payload?: any;
    error?: IChapterErrorState;
    memento?: () => void;
};



/**
 * ChapterActions
 */

//



/**
 * PersonificationReducer
 */

export interface IPersonification {
    personificationId: number;
    authorId: number;
    firstName: string;
    middleName: string;
    lastName: string;
    birthday: Date;
    createdDate: Date;
    modifiedDate: Date;
};

export interface IPersonificationCollection {
    personifications: IPersonification[];
};

export interface IPersonificationErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IPersonificationState {
    personifications: Record<number, IPersonification>;
    personificationErrorState: IPersonificationErrorState;
    pendingActions: IPersonificationReducerAction[];
};

export interface IPersonificationReducerAction {
    timestamp: number;
    type: string;
    payload?: any;
    error?: IPersonificationErrorState;
    memento?: () => void;
};



/**
 * PersonificationActions
 */

//



/**
 * PromptReducer
 */

export interface IPrompt {
    promptId: number;
    authorId: number;
    body: string;
    title: string;
    createdDate: Date;
    modifiedDate: Date;
};

export interface IPromptCollection {
    prompts: IPrompt[];
};

export interface IPromptErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IPromptState {
    prompts: Record<number, IPrompt>;
    promptErrorState: IPromptErrorState;
    pendingActions: IPromptReducerAction[];
};

export interface IPromptReducerAction {
    timestamp: number;
    type: string;
    payload?: any;
    error?: IPromptErrorState;
    memento?: () => void;
};



/**
 * PromptActions
 */

//



/**
 * ShortReducer
 */

export interface IShort {
    shortId: number;
    authorId: number;
    body: string;
    title: string;
    eventStart: Date;
    eventEnd: Date;
    createdDate: Date;
    modifiedDate: Date;
};

export interface IShortCollection {
    shorts: IShort[];
};

export interface IShortErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IShortState {
    shorts: Record<number, IShort>;
    shortErrorState: IShortErrorState;
    pendingActions: IShortReducerAction[];
};

export interface IShortReducerAction {
    timestamp: number;
    type: string;
    payload?: any;
    error?: IShortErrorState;
    memento?: () => void;
};



/**
 * ShortActions
 */

//



/**
 * TimelineReducer
 */

export interface ITimeline {
    timelineId: number;
    authorId: number;
    title: string;
    eventStart: Date;
    eventEnd: Date;
    createdDate: Date;
    modifiedDate: Date;
};

export interface ITimelineCollection {
    timelines: ITimeline[];
};

export interface ITimelineErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface ITimelineState {
    timelines: Record<number, ITimeline>;
    timelineErrorState: ITimelineErrorState;
    pendingActions: ITimelineReducerAction[];
};

export interface ITimelineReducerAction {
    timestamp: number;
    type: string;
    payload?: any;
    error?: ITimelineErrorState;
    memento?: () => void;
};



/**
 * TimelineActions
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
};

export interface INewChapter {
    authorId: number;
    bookId: number;
    timelineId?: number;
    title: string;
    sortOrder: number;
};

export interface INewPersonification {
    authorId: number;
    firstName: string;
    middleName: string;
    lastName: string;
    birthday: Date;
};

export interface INewPrompt {
    authorId: number;
    body: string;
    title: string;
};

export interface INewShort {
    authorId: number;
    body: string;
    title: string;
    eventStart: Date;
    eventEnd: Date;
};

export interface INewTimeline {
    authorId: number;
    title: string;
    eventStart: Date;
    eventEnd: Date;
};

