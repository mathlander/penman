// import { ThunkAction } from 'redux-thunk';
import { History } from 'history';

/**
 * RootReducer
 */

export interface IRootState {
    router: RouterState<History<HistoryLocationState>>;
    auth: IAuthenticationState;
    welcome: IWelcomeState;
    dashboard: IDashboardState;
    offline: IOfflineState;
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
    authenticatedUser: IAuthenticatedUser;
    authErrorState: IAuthenticationErrorState;
    pendingActions: IReplayableAction[];
    offlineActionQueue: IReplayableAction[],
};

export interface IAuthReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
    error?: IAuthenticationErrorState;
    memento?: IReplayableAction;
};

export interface INewUser {
	username: string;
	email: string;
	firstName: string;
	middleName: string;
	lastName: string;
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
    memento?: IReplayableAction
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
 * OfflineReducer
 */

export interface IReplayableAction {
    type: string;
    timestamp: number;
    serializedData: string;
    // memento: (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => void;
    playAction: (user:IAuthenticatedUser, suppressTimeoutAlert: boolean) => void;
};

export interface IOfflineState {
    isOffline: boolean;
};

export interface IOfflineReducerAction {
    type: string;
};

export interface IOfflineWorkItem<T> {
    clientId: UUID;
    onApiProcessed(successResponseData: T): T;
    toSerializedJSON(): string;
};

// usage: const book: Book = restoreOfflineWorkItemFromJSON<Book>(serializedObject, Book);
export function restoreOfflineWorkItemFromJSON<T>(serializedObject: string, ctor: new (serializedValue?: any) => T): T {
    return new ctor(JSON.parse(serializedObject, (key: string, value: any) => {
        if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return new Date(value);
        else return value;
    }));
}



/**
 * DashboardReducer
 */

export interface IDashboardState {
    scrollspyId: string | null;
};

export interface IDashboardReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
};



/**
 * BookReducer
 */

export interface IBook {
    bookId: number;
    authorId: number;
    timelineId: number | null;
    title: string;
    createdDate: Date;
    modifiedDate: Date;

    clientId: UUID;
    timelineClientId: UUID | null;
};

export class Book implements IBook, IOfflineWorkItem<IBook> {
    public bookId: number;
    public authorId: number;
    public timelineId: number | null;
    public title: string;
    public createdDate: Date;
    public modifiedDate: Date;
    public clientId: UUID;
    public timelineClientId: UUID;

    public timeline: ITimeline | null = null;

    constructor();
    constructor(book: IBook);
    constructor(book?: any) {
        let now = new Date();
        this.bookId = book && book.bookId || 0;
        this.authorId = book && book.authorId || 0;
        this.createdDate = new Date(book && book.createdDate || now);
        this.modifiedDate = new Date(book && book.modifiedDate || now);
        this.title = book && book.title || '';
        this.timelineId = book && book.timelineId || null;

        this.clientId = book && book.clientId || generateUuid();
        this.timelineClientId = book && book.timelineClientId || null;
    }

    public onApiProcessed(successResponseData: IBook) {
        this.bookId = successResponseData.bookId;
        this.authorId = successResponseData.authorId;
        this.clientId = successResponseData.clientId;
        this.createdDate = new Date(successResponseData.createdDate);
        this.modifiedDate = new Date(successResponseData.modifiedDate);
        this.title = successResponseData.title;
        this.timelineId = successResponseData.timelineId;
        return this;
    }

    public toSerializedJSON() {
        return JSON.stringify({
            bookId: this.bookId,
            authorId: this.authorId,
            clientId: this.clientId,
            createdDate: this.createdDate.toISOString(),
            modifiedDate: this.modifiedDate.toISOString(),
            title: this.title,
            timelineId: this.timelineId,
        });
    }
}

export interface IBookErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IBookState {
    clientIdLookup: Record<UUID, Book>;
    books: Record<number, Book>;
    bookErrorState: IBookErrorState;
    pendingActions: IReplayableAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export interface IBookReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
    error?: IBookErrorState;
    memento?: IReplayableAction
};



/**
 * ChapterReducer
 */

export interface IChapter {
    chapterId: number;
    bookId: number;
    authorId: number;
    timelineId: number | null;
    title: string;
    body: string;
    sortOrder: number;
    createdDate: Date;
    modifiedDate: Date;

    clientId: UUID;
    bookClientId: UUID;
    timelineClientId: UUID;
};

export class Chapter implements IChapter, IOfflineWorkItem<IChapter> {
    public chapterId: number;
    public bookId: number;
    public authorId: number;
    public timelineId: number | null;
    public title: string;
    public body: string;
    public sortOrder: number;
    public createdDate: Date;
    public modifiedDate: Date;
    public clientId: UUID;
    public bookClientId: UUID;
    public timelineClientId: UUID;

    public book: IBook | null = null;
    public timeline: ITimeline | null = null;

    constructor();
    constructor(chapter: IChapter);
    constructor(chapter?: any) {
        let now = new Date();
        this.chapterId = chapter && chapter.chapterId || 0;
        this.bookId = chapter && chapter.bookId || 0;
        this.authorId = chapter && chapter.authorId || 0;
        this.createdDate = new Date(chapter && chapter.createdDate || now);
        this.modifiedDate = new Date(chapter && chapter.modifiedDate || now);
        this.timelineId = chapter && chapter.timelineId || null;
        this.title = chapter && chapter.title || '';
        this.body = chapter && chapter.body || '';
        this.sortOrder = chapter && chapter.sortOrder || -1;

        this.clientId = chapter && chapter.clientId || generateUuid();
        this.bookClientId = chapter && chapter.bookClientId || '';
        this.timelineClientId = chapter && chapter.timelineClientId || '';
    }

    public onApiProcessed(successResponseData: IChapter) {
        this.chapterId = successResponseData.chapterId;
        this.bookId = successResponseData.bookId;
        this.authorId = successResponseData.authorId;
        this.createdDate = new Date(successResponseData.createdDate);
        this.modifiedDate = new Date(successResponseData.modifiedDate);
        this.timelineId = successResponseData.timelineId;
        this.title = successResponseData.title;
        this.body = successResponseData.body;
        this.sortOrder = successResponseData.sortOrder;
        this.clientId = successResponseData.clientId;
        return this;
    }

    public toSerializedJSON() {
        return JSON.stringify({
            chapterId: this.chapterId,
            bookId: this.bookId,
            authorId: this.authorId,
            createdDate: this.createdDate.toISOString(),
            modifiedDate: this.modifiedDate.toISOString(),
            timelineId: this.timelineId,
            title: this.title,
            body: this.body,
            sortOrder: this.sortOrder,

            clientId: this.clientId,
            bookClientId: this.bookClientId,
            timelineClientId: this.timelineClientId,
        });
    }
}

export interface IChapterErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IChapterState {
    clientIdLookup: Record<UUID, Chapter>;
    chapters: Record<number, Chapter>;
    chapterErrorState: IChapterErrorState;
    pendingActions: IReplayableAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export interface IChapterReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
    error?: IChapterErrorState;
    memento?: IReplayableAction
};



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

    clientId: UUID;
};

export class Personification implements IPersonification, IOfflineWorkItem<IPersonification> {
    public personificationId: number;
    public authorId: number;
    public firstName: string;
    public middleName: string;
    public lastName: string;
    public birthday: Date;
    public createdDate: Date;
    public modifiedDate: Date;
    public clientId: UUID;

    constructor();
    constructor(personification: IPersonification);
    constructor(personification?: any) {
        let now = new Date();
        this.personificationId = personification && personification.personificationId || 0;
        this.authorId = personification && personification.authorId || 0;
        this.createdDate = new Date(personification && personification.createdDate || now);
        this.modifiedDate = new Date(personification && personification.modifiedDate || now);
        this.firstName = personification && personification.firstName || '';
        this.middleName = personification && personification.middleName || '';
        this.lastName = personification && personification.lastName || '';
        this.birthday = new Date(personification && personification.birthday || now);

        this.clientId = personification && personification.clientId || generateUuid();
    }

    public onApiProcessed(successResponseData: IChapter) {
        this.personificationId = successResponseData.personificationId;
        this.authorId = successResponseData.authorId;
        this.createdDate = new Date(successResponseData.createdDate);
        this.modifiedDate = new Date(successResponseData.modifiedDate);
        this.firstName = successResponseData.firstName;
        this.middleName = successResponseData.middleName;
        this.lastName = successResponseData.lastName;
        this.birthday = successResponseData.birthday;
        this.clientId = successResponseData.clientId;
        return this;
    }

    public toSerializedJSON() {
        return JSON.stringify({
            personificationId: this.personificationId,
            authorId: this.authorId,
            createdDate: this.createdDate.toISOString(),
            modifiedDate: this.modifiedDate.toISOString(),
            firstName: this.firstName,
            middleName: this.middleName,
            lastName: this.lastName,
            birthday: this.birthday,

            clientId: this.clientId,
        });
    }
}

export interface IPersonificationErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IPersonificationState {
    clientIdLookup: Record<UUID, Personification>;
    personifications: Record<number, Personification>;
    personificationErrorState: IPersonificationErrorState;
    pendingActions: IReplayableAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export interface IPersonificationReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
    error?: IPersonificationErrorState;
    memento?: IReplayableAction
};



/**
 * PromptReducer
 */

export interface IPrompt {
    promptId: number;
    authorId: number;
    title: string;
    body: string;
    createdDate: Date;
    modifiedDate: Date;

    clientId: UUID;
};

export class Prompt implements IPrompt, IOfflineWorkItem<IPrompt> {
    public promptId: number;
    public authorId: number;
    public title: string;
    public body: string;
    public createdDate: Date;
    public modifiedDate: Date;
    public clientId: UUID;

    constructor();
    constructor(prompt: IPrompt);
    constructor(prompt?: any) {
        let now = new Date();
        this.promptId = prompt && prompt.promptId || 0;
        this.authorId = prompt && prompt.authorId || 0;
        this.createdDate = new Date(prompt && prompt.createdDate || now);
        this.modifiedDate = new Date(prompt && prompt.modifiedDate || now);
        this.title = prompt && prompt.title || '';
        this.body = prompt && prompt.body || '';

        this.clientId = prompt && prompt.clientId || generateUuid();
    }

    public onApiProcessed(successResponseData: IPrompt) {
        this.promptId = successResponseData.promptId;
        this.authorId = successResponseData.authorId;
        this.createdDate = new Date(successResponseData.createdDate);
        this.modifiedDate = new Date(successResponseData.modifiedDate);
        this.title = successResponseData.title;
        this.body = successResponseData.body;
        this.clientId = successResponseData.clientId;
        return this;
    }

    public toSerializedJSON() {
        return JSON.stringify({
            promptId: this.promptId,
            authorId: this.authorId,
            createdDate: this.createdDate.toISOString(),
            modifiedDate: this.modifiedDate.toISOString(),
            title: this.title,
            body: this.body,

            clientId: this.clientId,
        });
    }
}

export interface IPromptErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IPromptState {
    clientIdLookup: Record<UUID, Prompt>;
    prompts: Record<number, Prompt>;
    promptErrorState: IPromptErrorState;
    pendingActions: IReplayableAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export interface IPromptReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
    error?: IPromptErrorState;
    memento?: IReplayableAction
};



/**
 * ShortReducer
 */

export interface IShort {
    shortId: number;
    authorId: number;
    title: string;
    body: string;
    eventStart: Date;
    eventEnd: Date;
    createdDate: Date;
    modifiedDate: Date;

    clientId: UUID;
};

export class Short implements IShort, IOfflineWorkItem<IShort> {
    public shortId: number;
    public authorId: number;
    public title: string;
    public body: string;
    public eventStart: Date;
    public eventEnd: Date;
    public createdDate: Date;
    public modifiedDate: Date;
    public clientId: UUID;

    constructor();
    constructor(short: IShort);
    constructor(short?: any) {
        let now = new Date();
        this.shortId = short && short.shortId || 0;
        this.authorId = short && short.authorId || 0;
        this.eventStart = new Date(short && short.eventStart || now);
        this.eventEnd = new Date(short && short.eventEnd || now);
        this.createdDate = new Date(short && short.createdDate || now);
        this.modifiedDate = new Date(short && short.modifiedDate || now);
        this.title = short && short.title || '';
        this.body = short && short.body || '';

        this.clientId = short && short.clientId || generateUuid();
    }

    public onApiProcessed(successResponseData: IShort) {
        this.shortId = successResponseData.shortId;
        this.authorId = successResponseData.authorId;
        this.eventStart = new Date(successResponseData.eventStart);
        this.eventEnd = new Date(successResponseData.eventEnd);
        this.createdDate = new Date(successResponseData.createdDate);
        this.modifiedDate = new Date(successResponseData.modifiedDate);
        this.title = successResponseData.title;
        this.body = successResponseData.body;
        this.clientId = successResponseData.clientId;
        return this;
    }

    public toSerializedJSON() {
        return JSON.stringify({
            shortId: this.shortId,
            authorId: this.authorId,
            eventStart: this.eventStart.toISOString(),
            eventEnd: this.eventEnd.toISOString(),
            createdDate: this.createdDate.toISOString(),
            modifiedDate: this.modifiedDate.toISOString(),
            title: this.title,
            body: this.body,

            clientId: this.clientId,
        });
    }
}

export interface IShortErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IShortState {
    clientIdLookup: Record<UUID, Short>;
    shorts: Record<number, Short>;
    shortErrorState: IShortErrorState;
    pendingActions: IReplayableAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export interface IShortReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
    error?: IShortErrorState;
    memento?: IReplayableAction
};



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

    clientId: UUID;
};

export class Timeline implements ITimeline, IOfflineWorkItem<ITimeline> {
    public timelineId: number;
    public authorId: number;
    public title: string;
    public eventStart: Date;
    public eventEnd: Date;
    public createdDate: Date;
    public modifiedDate: Date;
    public clientId: UUID;

    constructor();
    constructor(timeline: ITimeline);
    constructor(timeline?: any) {
        let now = new Date();
        this.timelineId = timeline && timeline.timelineId || 0;
        this.authorId = timeline && timeline.authorId || 0;
        this.eventStart = new Date(timeline && timeline.eventStart || now);
        this.eventEnd = new Date(timeline && timeline.eventEnd || now);
        this.createdDate = new Date(timeline && timeline.createdDate || now);
        this.modifiedDate = new Date(timeline && timeline.modifiedDate || now);
        this.title = timeline && timeline.title || '';

        this.clientId = timeline && timeline.clientId || generateUuid();
    }

    public onApiProcessed(successResponseData: ITimeline) {
        this.timelineId = successResponseData.timelineId;
        this.authorId = successResponseData.authorId;
        this.eventStart = new Date(successResponseData.eventStart);
        this.eventEnd = new Date(successResponseData.eventEnd);
        this.createdDate = new Date(successResponseData.createdDate);
        this.modifiedDate = new Date(successResponseData.modifiedDate);
        this.title = successResponseData.title;
        this.clientId = successResponseData.clientId;
        return this;
    }

    public toSerializedJSON() {
        return JSON.stringify({
            timelineId: this.timelineId,
            authorId: this.authorId,
            eventStart: this.eventStart.toISOString(),
            eventEnd: this.eventEnd.toISOString(),
            createdDate: this.createdDate.toISOString(),
            modifiedDate: this.modifiedDate.toISOString(),
            title: this.title,

            clientId: this.clientId,
        });
    }
}

export interface ITimelineErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface ITimelineState {
    clientIdLookup: Record<UUID, Timeline>;
    timelines: Record<number, Timeline>;
    timelineErrorState: ITimelineErrorState;
    pendingActions: IReplayableAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export interface ITimelineReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
    error?: ITimelineErrorState;
    memento?: IReplayableAction
};



/**
 * RelationshipReducer
 */

export interface IRelationshipErrorState {
    internalErrorMessage?: string | null;
    displayErrorMessage?: string | null;
};

export interface IRelationshipState {
    tagToPersonificationMap: Record<number, number>;
    personificationToTagMap: Record<number, number>;

    promptToPersonificationMap: Record<number, number>;
    personificationToPrompMap: Record<number, number>;

    tagToPromptMap: Record<number, number>;
    promptToTagMap: Record<number, number>;

    personificationToShortMap: Record<number, number>;
    shortToPersonificationMap: Record<number, number>;

    promptToShortMap: Record<number, number>;
    shortToPromptMap: Record<number, number>;

    tagToShortMap: Record<number, number>;
    shortToTagMap: Record<number, number>;

    relationshipErrorState: IRelationshipErrorState;
    pendingActions: IReplayableAction[];
    offlineActionQueue: IReplayableAction[],
};

export interface IRelationshipReducerAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: any;
    error?: IRelationshipErrorState;
    memento?: IReplayableAction
};

export interface INewRelationship {
    join: string;
    leftId: number;
    rightId: number;
    leftClientId: UUID;
    rightClientId: UUID;
};

export interface IDeleteRelationship {
    join: string;
    leftId: number;
    rightId: number;
};



/**
 * HyperText
 */

export interface IHyperTextState {
    textType: string | null;
    fontFamily: string | null;
    fontSize: number | null;
    isEmboldened: boolean | null;
    isItalicized: boolean | null;
    isUnderlined: boolean | null;
    isHighlighted: boolean | null;
}

export interface IHyperTextStateBuilder {
    textType?: string | null;
    fontFamily?: string | null;
    fontSize?: number | null;
    isEmboldened?: boolean | null;
    isItalicized?: boolean | null;
    isUnderlined?: boolean | null;
    isHighlighted?: boolean | null;
}



/**
 * No-op
 */

export const mementoNoOp = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {};


/**
 * GUID
 */


export type UUID = string;

export const generateUuid: () => UUID = () => {
    const randomValueArray = new Uint8Array(1);
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = crypto.getRandomValues(randomValueArray)[0] >> 4;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

