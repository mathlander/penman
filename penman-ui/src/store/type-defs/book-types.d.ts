import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { UUID, generateUuid, mergePlainText, mergeRichText } from '../utilities';
import { IClientChapter, Chapter } from './chapter-types';
import { PrioritizableStorageItem, PersistenceTypes } from './storage-types';

export interface ICreateBookDto {
    userId: number;
    clientId: UUID;
    title: string;
    eventStart?: Date;
    eventEnd?: Date;
};

export interface IUpdateBookDto {
    bookId: number;
    userId: number;
    clientId: UUID;
    title: string;
    eventStart?: Date;
    eventEnd?: Date;
};

export interface IDeleteBookDto {
    bookId: number;
};

export interface IReadBookDto {
    bookId: number;
};

export interface IReadAllBooksDto {
    userId: number;
    lastReadAll?: Date;
};

export interface IBook extends ICreateBookDto, IUpdateBookDto, IDeleteBookDto, IReadBookDto {
    createdDate: Date;
    modifiedDate: Date;
    isDeleted: boolean;
};

export interface IBookShadow {
    bookId?: number;
    userId?: number;
    clientId?: UUID;
    title?: string;
    eventStart?: Date | null;
    eventEnd?: Date | null;
    createdDate?: Date;
    modifiedDate?: Date;
    isDeleted?: boolean;
};

export interface IClientBook extends IBook {
    chapters?: Chapter[];
    clientIdHistory: UUID[];
    handleIdCollision: () => void;
};

export interface IClientBookShadow extends IBookShadow {
    chapters?: Chapter[];
    // clientIdHistory?: UUID[];
};

export interface IBookCollection {
    books: IClientBook[];
    lastReadAll: Date;
};

export interface IBookAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload: any;
    error?: IError;
    memento?: IReplayableAction;
};

export enum BooksPageTab {
    originatedTab = 0,
    collaborationTab = 1,
};

export interface IBookState {
    uuidLookup: Record<UUID, Book>;
    books: Record<number, Book>;
    bookErrorState: IError;
    pendingActions: IBookAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
    activeTab: BooksPageTab;
};

export const nullBook: IBook = {
    bookId: 0,
    userId: 0,
    clientId: '',
    title: '',

    createdDate: defaultDate,
    modifiedDate: defaultDate,
    isDeleted: false,
};

export const defaultBookState: IBookState = {
    uuidLookup: {},
    books: {},
    bookErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAll: defaultDate,
};

export class Book extends PrioritizableStorageItem implements IClientBook {
    private _bookId: number;
    private _userId: number;
    private _clientId: UUID;
    private _eventStart?: Date;
    private _eventEnd?: Date;
    private _title: string;

    private _createdDate: Date;
    private _modifiedDate: Date;
    private _isDeleted: boolean;

    private _clientIdHistory: UUID[];

    private _overlay: IClientBookShadow;

    get bookId(): number { this.readAccessed(); return this._overlay.bookId || this._bookId; }
    set bookId(value: number) { this.writeAccessed(); this._overlay.bookId = value; }
    get userId(): number { this.readAccessed(); return this._overlay.userId || this._userId; }
    set userId(value: number) { this.writeAccessed(); this._overlay.userId = value; }
    get clientId(): UUID { this.readAccessed(); return this._overlay.clientId || this._clientId; }
    set clientId(value: UUID) { this.writeAccessed(); this._overlay.clientId = value; }
    get eventStart(): Date { this.readAccessed(); return this._overlay.eventStart || this._eventStart; }
    set eventStart(value: Date) { this.writeAccessed(); this._overlay.eventStart = value; }
    get eventEnd(): Date { this.readAccessed(); return this._overlay.eventEnd || this._eventEnd; }
    set eventEnd(value: Date) { this.writeAccessed(); this._overlay.eventEnd = value; }
    get title(): string { this.readAccessed(); return this._overlay.title || this._title; }
    set title(value: string) { this.writeAccessed(); this._overlay.title = value; }

    get createdDate(): Date { this.readAccessed(); return this._overlay.createdDate || this._createdDate; }
    set createdDate(value: Date) { this.writeAccessed(); this._overlay.createdDate = value; }
    get modifiedDate() { this.readAccessed(); return this._overlay.modifiedDate || this._modifiedDate; }
    set modifiedDate(value: Date) { this.writeAccessed(); this._overlay.modifiedDate = value; }
    get isDeleted(): boolean { this.readAccessed(); return this._overlay.isDeleted || this._isDeleted; }
    set isDeleted(value: boolean) { this.writeAccessed(); this._overlay.isDeleted = value; }

    get clientIdHistory(): UUID[] { this.readAccessed(); return this._clientIdHistory; }
    set clientIdHistory(value: UUID[]) { this.writeAccessed(); this._clientIdHistory = value; }

    constructor();
    constructor(book: IClientBook);
    constructor(book?: any) {
        super();
        let now = new Date();
        this._bookId = book && book.bookId || 0;
        this._userId = book && book.userId || 0;
        this._clientId = book && book.clientId || generateUuid();
        this._title = book && book.title || '';

        if (book && book.eventStart) this._eventStart = new Date(book.eventStart);
        if (book && book.eventEnd) this._eventEnd = new Date(book.eventEnd);

        this._createdDate = new Date(book && book.createdDate || now);
        this._modifiedDate = new Date(book && book.modifiedDate || now);
        this._isDeleted = book && book.isDeleted || false;

        this._clientIdHistory = book && book.clientIdHistory || [this._clientId];

        this._overlay = book && book.overlay || {};

        // meta data is only present on full load
        this._isPartial = (this._bookId > 0 && this._createdDate.getTime() === now.getTime());
    }

    static fromSerializedJSON(serializedObject: string) {
        return new Book(JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return value ? new Date(value) : undefined;
            else return value;
        }));
    }

    public handleIdCollision() {
        const newClientId = generateUuid();
        this._clientId = newClientId;
        this._clientIdHistory.push(newClientId);
    }

    public onApiProcessed(successResponseData: IBook, clearOverlay = false) {
        this.writeAccessed();
        if (clearOverlay) {
            // this is the case when an update, originated by the current client, has completed
            // no merge needs to be done
            Object.keys(successResponse).forEach((key: string) => {
                if (key === 'bookId') this._bookId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'title') this._title = successResponseData[key];
                else if (key === 'eventStart' && successResponseData[key]) this._eventStart = new Date(successResponseData[key]);
                else if (key === 'eventEnd' && successResponseData[key]) this._eventEnd = new Date(successResponseData[key]);

                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
            });
            this._overlay = {};
        } else {
            // this is the case when an update, originated by a collaborator, has been pushed
            // to the current client and updates must be merged
            Object.keys(successResponse).forEach((key: string) => {
                if (key === 'bookId') this._bookId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'eventStart' && successResponseData[key]) this._eventStart = new Date(successResponseData[key]);
                else if (key === 'eventEnd' && successResponseData[key]) this._eventEnd = new Date(successResponseData[key]);
                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
                else if (key === 'title') {
                    // if the title has been modified, merge
                    if (this._overlay.title) {
                        this._overlay.title = mergePlainText(this._title, this._overlay.title, successResponseData[key]);
                    }
                    // update the base text
                    this._title = successResponseData[key];
                }
            });
        }
        this._isPartial = false;
        return this;
    }

    private stringifyOverlay(): string | null {
        if (!this.isDirty()) return null;
        return JSON.stringify(this._overlay, (key, value) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return value ? value.toISOString() : undefined;
            else return value;
        });
    }

    public toSerializedJSON() {
        return JSON.stringify(Object.assign({
            bookId: this._bookId,
            userId: this._userId,
            clientId: this._clientId,
            eventStart: this._eventStart?.toISOString() || undefined,
            eventEnd: this._eventEnd?.toISOString() || undefined,
            title: this._title,
            createdDate: this._createdDate.toISOString(),
            modifiedDate: this._modifiedDate.toISOString(),
            isDeleted: this._isDeleted,
            clientIdHistory: this._clientIdHistory,
        }, this.isDirty() ? { overlay: this.stringifyOverlay() } : null));
    }

    public computeWeight(persistenceType: PersistenceTypes = PersistenceTypes.heavy) {
        if ((persistenceType === PersistenceTypes.forget || this._isDeleted) && !this.isDirty()) return 0;
        else return this.serialize(persistenceType).length;
    }

    public serialize(persistenceType: PersistenceTypes = PersistenceTypes.heavy) {
        // for now, dirty => heavy
        if ((persistenceType === PersistenceTypes.forget || this._isDeleted) && !this.isDirty()) {
            return '';
        } else if (persistenceType === PersistenceTypes.feather && !this.isDirty()) {
            return JSON.stringify({
                bookId: this._bookId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
            });
        } else if (persistenceType === PersistenceTypes.light && !this.isDirty()) {
            return JSON.stringify({
                bookId: this._bookId,
                title: this._title,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
            });
        } else {
            return this.toSerializedJSON();
        }
    }

    public restore(serializedData: string) { return Book.fromSerializedJSON(serializedData); }
    public isDirty() { return Object.keys(this._overlay).length > 0; }

    public toCreateDto(): any | ICreateBookDto {
        let dto = {
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            title: this._overlay.title || this._title,
        };
        if (this._overlay.eventStart || this._eventStart) dto.eventStart = (this._overlay.eventStart || this._eventStart)?.toISOString();
        if (this._overlay.eventEnd || this._eventEnd) dto.eventEnd = (this._overlay.eventEnd || this._eventEnd)?.toISOString();
        // disallow half-open intervals
        if (dto.eventStart ^ dto.eventEnd) {
            if (dto.eventStart) dto.eventEnd = dto.eventStart;
            else dto.eventStart = dto.eventEnd;
        }
        return dto;
    }

    public toUpdateDto(): any | IUpdateBookDto {
        let dto = {
            bookId: this._bookId,
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            title: this._overlay.title || this._title,
        };

        if (this._eventStart && this._overlay.eventStart === null) dto.eventStart = null;
        else if (this._overlay.eventStart) dto.eventStart = this._overlay.eventStart?.toISOString();
        else if (this._eventStart) dto.eventStart = this._eventStart?.toISOString();

        if (this._eventEnd && this._overlay.eventEnd === null) dto.eventEnd = null;
        else if (this._overlay.eventEnd) dto.eventEnd = this._overlay.eventEnd?.toISOString();
        else if (this._eventEnd) dto.eventStart = this._eventEnd?.toISOString();

        // disallow half-open intervals
        if (dto.eventStart ^ dto.eventEnd) {
            if (dto.eventStart) dto.eventEnd = dto.eventStart;
            else dto.eventStart = dto.eventEnd;
        }

        return dto;
    }
}
