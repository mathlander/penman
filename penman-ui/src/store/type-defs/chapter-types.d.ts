import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { UUID, generateUuid, mergePlainText, mergeRichText } from '../utilities';
import { PrioritizableStorageItem, PersistenceTypes } from './storage-types';

export interface ICreateChapterDto {
    userId: number;
    bookId: number;
    clientId: UUID;
    eventStart: Date;
    eventEnd: Date;
    sortOrder: number;
    title: string;
    body: string;
};

export interface IUpdateChapterDto {
    chapterId: number;
    userId: number;
    bookId: number;
    clientId: UUID;
    eventStart: Date;
    eventEnd: Date;
    sortOrder: number;
    title: string;
    body: string;
};

export interface IDeleteChapterDto {
    chapterId: number;
};

export interface IReadChapterDto {
    chapterId: number;
};

export interface IReadAllChaptersDto {
    userId: number;
    bookId: number;
    lastReadAll?: Date;
};

export interface IChapter extends ICreateChapterDto, IUpdateChapterDto, IDeleteChapterDto, IReadChapterDto {
    createdDate: Date;
    modifiedDate: Date;
    isDeleted: boolean;
};

export interface IChapterShadow {
    chapterId?: number;
    userId?: number;
    bookId?: number;
    clientId?: UUID;
    eventStart?: Date | null;
    eventEnd?: Date | null;
    title?: string;
    body?: string;
    createdDate?: Date;
    modifiedDate?: Date;
    isDeleted?: boolean;
};

export interface IClientChapter extends IChapter {
    bookClientId: UUID;
    clientIdHistory: UUID[];
    handleIdCollision: () => void;
};

export interface IClientChapterShadow extends IChapterShadow {
    bookClientId?: UUID;
    // clientIdHistory?: UUID[];
};

export interface IChapterCollection {
    chapters: IClientChapter[];
    lastReadAll: Date;
};

export interface IChapterAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload: any;
    error?: IError;
    memento?: IReplayableAction;
};

export interface IChapterState {
    uuidLookup: Record<UUID, Chapter>;
    bookIdLookup: Record<number, Record<number, Chapter>>;
    chapters: Record<number, Chapter>;
    chapterErrorState: IError;
    pendingActions: IChapterAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export const nullChapter: IChapter = {
    chapterId: 0,
    userId: 0,
    bookId: 0,
    clientId: '',
    eventStart: defaultDate,
    eventEnd: defaultDate,
    sortOrder: 0,
    title: '',
    body: '',

    createdDate: defaultDate,
    modifiedDate: defaultDate,
    isDeleted: false,
};

export const defaultChapterState: IChapterState = {
    uuidLookup: {},
    bookIdLookup: {},
    chapters: {},
    chapterErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAll: defaultDate,
};

export class Chapter extends PrioritizableStorageItem implements IClientChapter {
    private _chapterId: number;
    private _userId: number;
    private _bookId: number;
    private _clientId: UUID;
    private _eventStart: Date;
    private _eventEnd: Date;
    private _sortOrder: number;
    private _title: string;
    private _body: string;

    private _createdDate: Date;
    private _modifiedDate: Date;
    private _isDeleted: boolean;

    private _bookClientId: UUID;
    private _clientIdHistory: UUID[];

    private _overlay: IClientChapterShadow;

    get chapterId(): number { this.readAccessed(); return this._overlay.chapterId || this._chapterId; }
    set chapterId(value: number) { this.writeAccessed(); this._overlay.chapterId = value; }
    get userId(): number { this.readAccessed(); return this._overlay.userId || this._userId; }
    set userId(value: number) { this.writeAccessed(); this._overlay.userId = value; }
    get bookId(): number { this.readAccessed(); return this._overlay.bookId || this._bookId; }
    set bookId(value: number) { this.writeAccessed(); this._overlay.bookId = value; }
    get clientId(): UUID { this.readAccessed(); return this._overlay.clientId || this._clientId; }
    set clientId(value: UUID) { this.writeAccessed(); this._overlay.clientId = value; }
    get eventStart(): Date { this.readAccessed(); return this._overlay.eventStart || this._eventStart; }
    set eventStart(value: Date) { this.writeAccessed(); this._overlay.eventStart = value; }
    get eventEnd(): Date { this.readAccessed(); return this._overlay.eventEnd || this._eventEnd; }
    set eventEnd(value: Date) { this.writeAccessed(); this._overlay.eventEnd = value; }
    get sortOrder(): number { this.readAccessed(); return this._overlay.sortOrder || this._sortOrder; }
    set sortOrder(value: number) { this.writeAccessed(); this._overlay.sortOrder = value; }
    get title(): string { this.readAccessed(); return this._overlay.title || this._title; }
    set title(value: string) { this.writeAccessed(); this._overlay.title = value; }
    get body(): string { this.readAccessed(); return this._overlay.body || this._body; }
    set body(value: string) { this.writeAccessed(); this._overlay.body = value; }

    get createdDate(): Date { this.readAccessed(); return this._overlay.createdDate || this._createdDate; }
    set createdDate(value: Date) { this.writeAccessed(); this._overlay.createdDate = value; }
    get modifiedDate() { this.readAccessed(); return this._overlay.modifiedDate || this._modifiedDate; }
    set modifiedDate(value: Date) { this.writeAccessed(); this._overlay.modifiedDate = value; }
    get isDeleted(): boolean { this.readAccessed(); return this._overlay.isDeleted || this._isDeleted; }
    set isDeleted(value: boolean) { this.writeAccessed(); this._overlay.isDeleted = value; }

    get bookClientId(): UUID { this.readAccessed(); return this._overlay.bookClientId || this._bookClientId; }
    set bookClientId(value: UUID) { this.writeAccessed(); this._overlay.bookClientId = value; }
    get clientIdHistory(): UUID[] { this.readAccessed(); return this._clientIdHistory; }
    set clientIdHistory(value: UUID[]) { this.writeAccessed(); this._clientIdHistory = value; }

    constructor();
    constructor(chapter: IClientChapter);
    constructor(chapter?: any) {
        super();
        let now = new Date();
        this._chapterId = chapter && chapter.chapterId || 0;
        this._userId = chapter && chapter.userId || 0;
        this._bookId = chapter && chapter.bookId || 0;
        this._clientId = chapter && chapter.clientId || generateUuid();
        this._eventStart = new Date(chapter && chapter.eventStart || now);
        this._eventEnd = new Date(chapter && chapter.eventEnd || now);
        this._sortOrder = chapter && chapter.sortOrder || 0;
        this._title = chapter && chapter.title || '';
        this._body = chapter && chapter.body || '';

        this._createdDate = new Date(chapter && chapter.createdDate || now);
        this._modifiedDate = new Date(chapter && chapter.modifiedDate || now);
        this._isDeleted = chapter && chapter.isDeleted || false;

        this._bookClientId = chapter && chapter.bookClientId || '';
        this._clientIdHistory = chapter && chapter.clientIdHistory || [this._clientId];

        this._overlay = chapter && chapter.overlay || {};

        // meta data is only present on full load
        this._isPartial = (this._chapterId > 0 && this._createdDate.getTime() === now.getTime());
    }

    static fromSerializedJSON(serializedObject: string) {
        return new Chapter(JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return value ? new Date(value) : undefined;
            else return value;
        }));
    }

    public handleIdCollision() {
        const newClientId = generateUuid();
        this._clientId = newClientId;
        this._clientIdHistory.push(newClientId);
    }

    public onApiProcessed(successResponseData: IChapter, clearOverlay = false) {
        this.writeAccessed();
        if (clearOverlay) {
            // this is the case when an update, originated by the current client, has completed
            // no merge needs to be done
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'chapterId') this._chapterId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'bookId') this._bookId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'eventStart' && successResponseData[key]) this._eventStart = new Date(successResponseData[key]);
                else if (key === 'eventEnd' && successResponseData[key]) this._eventEnd = new Date(successResponseData[key]);
                else if (key === 'sortOrder') this._sortOrder = successResponseData[key];
                else if (key === 'title') this._title = successResponseData[key];
                else if (key === 'body') this._body = successResponseData[key];

                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
            });
            this._overlay = {};
        } else {
            // this is the case when an update, originated by a collaborator, has been pushed
            // to the current client and updates must be merged
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'chapterId') this._chapterId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'bookId') this._bookId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'eventStart' && successResponseData[key]) this._eventStart = new Date(successResponseData[key]);
                else if (key === 'eventEnd' && successResponseData[key]) this._eventEnd = new Date(successResponseData[key]);
                else if (key === 'sortOrder') this._sortOrder = successResponseData[key];
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
                else if (key === 'body') {
                    // if the body has been modified, merge
                    if (this._overlay.body) {
                        this._overlay.body = mergeRichText(this._body, this._overlay.bookId, successResponseData[key]);
                    }
                    // update the base text
                    this._body = successResponseData[key];
                }
            });
        }
        this._isPartial = false;
        return this;
    }

    private stringifyOverlay(): string | null {
        if (!this.isDirty()) return null;
        return JSON.stringify(this._overlay, (key, value) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return value.toISOString();
            else return value;
        });
    }

    public toSerializedJSON() {
        return JSON.stringify(Object.assign({
            chapterId: this._chapterId,
            userId: this._userId,
            bookId: this._bookId,
            clientId: this._clientId,
            eventStart: this._eventStart,
            eventEnd: this._eventEnd,
            title: this._title,
            body: this._body,
            createdDate: this._createdDate.toISOString(),
            modifiedDate: this._modifiedDate.toISOString(),
            isDeleted: this._isDeleted,
            bookClientId: this._bookClientId,
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
                chapterId: this._chapterId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
            });
        } else if (persistenceType === PersistenceTypes.light && !this.isDirty()) {
            return JSON.stringify({
                chapterId: this._chapterId,
                bookId: this._bookId,
                title: this._title,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
                bookClientId: this._bookClientId,
            });
        } else {
            return this.toSerializedJSON();
        }
    }

    public restore(serializedData: string) { return Chapter.fromSerializedJSON(serializedData); }
    public isDirty() { return Object.keys(this._overlay).length > 0; }

    public toCreateDto(): any | ICreateChapterDto {
        let dto = {
            userId: this._overlay.userId || this._userId,
            bookId: this._overlay.bookId || this._bookId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            eventStart: (this._overlay.eventStart || this._eventStart)?.toISOString(),
            eventEnd: (this._overlay.eventEnd || this._eventEnd)?.toISOString(),
            sortOrder: this._overlay.sortOrder || this._sortOrder,
            title: this._overlay.title || this._title,
            body: this._overlay.body || this._body,
        };
        return dto;
    }

    public toUpdateDto(): any | IUpdateChapterDto {
        let dto = {
            chapterId: this._chapterId,
            userId: this._overlay.userId || this._userId,
            bookId: this._overlay.bookId || this._bookId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            eventStart: (this._overlay.eventStart || this._eventStart)?.toISOString(),
            eventEnd: (this._overlay.eventEnd || this._eventEnd)?.toISOString(),
            sortOrder: this._overlay.sortOrder || this._sortOrder,
            title: this._overlay.title || this._title,
            body: this._overlay.body || this._body,
        };
        return dto;
    }
}
