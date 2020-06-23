import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { UUID, generateUuid, mergePlainText, mergeRichText } from '../utilities';
import { PrioritizableStorageItem, PersistenceTypes } from './storage-types';

export interface ICreateTagDto {
    userId: number;
    clientId: UUID;
    tagName: string;
};

export interface IUpdateTagDto {
    tagId: number;
    userId: number;
    clientId: UUID;
    tagName: string;
};

export interface IDeleteTagDto {
    tagId: number;
};

export interface IReadTagDto {
    tagId: number;
};

export interface IReadAllTagsDto {
    userId: number;
    lastReadAll?: Date;
};

export interface ITag extends ICreateTagDto, IUpdateTagDto, IDeleteTagDto, IReadTagDto {
    createdDate: Date;
    modifiedDate: Date;
    isDeleted: boolean;
};

export interface ITagShadow {
    tagId?: number;
    userId?: number;
    clientId?: UUID;
    tagName?: string;
    createdDate?: Date;
    modifiedDate?: Date;
    isDeleted?: boolean;
};

export interface IClientTag extends ITag {
    clientIdHistory: UUID[];
    handleIdCollision: () => void;
};

export interface IClientTagShadow extends ITagShadow {
    // clientIdHistory: UUID[];
};

export interface ITagCollection {
    tags: IClientTag[];
    lastReadAll: Date;
};

export interface ITagAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload: any;
    error?: IError;
    memento?: IReplayableAction;
};

export interface ITagState {
    uuidLookup: Record<UUID, Tag>;
    tags: Record<number, Tag>;
    tagErrorState: IError;
    pendingActions: ITagAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export const nullTag: ITag = {
    tagId: 0,
    userId: 0,
    clientId: '',
    tagName: '',

    createdDate: defaultDate,
    modifiedDate: defaultDate,
    isDeleted: false,
};

export const defaultTagState: ITagState = {
    uuidLookup: {},
    tags: {},
    tagErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAll: defaultDate,
};

export class Tag extends PrioritizableStorageItem implements IClientTag {
    private _tagId: number;
    private _userId: number;
    private _clientId: UUID;
    private _tagName: string;

    private _createdDate: Date;
    private _modifiedDate: Date;
    private _isDeleted: boolean;

    private _clientIdHistory: UUID[];

    private _overlay: IClientTagShadow;

    get tagId(): number { this.readAccessed(); return this._overlay.tagId || this._tagId; }
    set tagId(value: number) { this.writeAccessed(); this._overlay.tagId = value; }
    get userId(): number { this.readAccessed(); return this._overlay.userId || this._userId; }
    set userId(value: number) { this.writeAccessed(); this._overlay.userId = value; }
    get clientId(): UUID { this.readAccessed(); return this._overlay.clientId || this._clientId; }
    set clientId(value: UUID) { this.writeAccessed(); this._overlay.clientId = value; }
    get tagName(): string { this.readAccessed(); return this._overlay.tagName || this._tagName; }
    set tagName(value: string) { this.writeAccessed(); this._overlay.tagName = value; }

    get createdDate(): Date { this.readAccessed(); return this._overlay.createdDate || this._createdDate; }
    set createdDate(value: Date) { this.writeAccessed(); this._overlay.createdDate = value; }
    get modifiedDate() { this.readAccessed(); return this._overlay.modifiedDate || this._modifiedDate; }
    set modifiedDate(value: Date) { this.writeAccessed(); this._overlay.modifiedDate = value; }
    get isDeleted(): boolean { this.readAccessed(); return this._overlay.isDeleted || this._isDeleted; }
    set isDeleted(value: boolean) { this.writeAccessed(); this._overlay.isDeleted = value; }

    get clientIdHistory(): UUID[] { this.readAccessed(); return this._clientIdHistory; }
    set clientIdHistory(value: UUID[]) { this.writeAccessed(); this._clientIdHistory = value; }

    constructor();
    constructor(tag: IClientTag);
    constructor(tag?: any) {
        super();
        let now = new Date();
        this._tagId = tag && tag.tagId || 0;
        this._userId = tag && tag.userId || 0;
        this._clientId = tag && tag.clientId || generateUuid();
        this._tagName = tag && tag.tagName || '';

        this._createdDate = new Date(tag && tag.createdDate || now);
        this._modifiedDate = new Date(tag && tag.modifiedDate || now);
        this._isDeleted = tag && tag.isDeleted || false;

        this._clientIdHistory = tag && tag.clientIdHistory || [this._clientId];

        this._overlay = tag && tag.overlay || {};

        // meta data is only present on full load
        this._isPartial = (this._tagId > 0 && this._createdDate.getTime() === now.getTime());
    }

    static fromSerializedJSON(serializedObject: string) {
        return new Tag(JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return value ? new Date(value) : undefined;
            else return value;
        }));
    }

    public handleIdCollision() {
        const newClientId = generateUuid();
        this._clientId = newClientId;
        this._clientIdHistory.push(newClientId);
    }

    public onApiProcessed(successResponseData: ITag, clearOverlay = false) {
        this.writeAccessed();
        if (clearOverlay) {
            // this is the case when an update, originated by the current client, has completed
            // no merge needs to be done
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'tagId') this._tagId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'tagName') this._tagName = successResponseData[key];

                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
            });
            this._overlay = {};
        } else {
            // this is the case when an update, originated by a collaborator, has been pushed
            // to the current client and updates must be merged
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'tagId') this._tagId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
                else if (key === 'tagName') {
                    // if the name has been modified, merge
                    if (this._overlay.tagName) {
                        this._overlay.tagName = mergePlainText(this._tagName, this._overlay.tagName, successResponseData[key]);
                    }
                    // update the base text
                    this._tagName = successResponseData[key];
                }
            });
        }
        this._isPartial = false;
        return this;
    }

    private stringifyOverlay(): string | null {
        if (!this.isDirty()) return null;
        return JSON.stringify(this._overlay, (key, value) => {
            if (key.endsWith('Date')) return value.toISOString();
            else return value;
        });
    }

    public toSerializedJSON() {
        return JSON.stringify(Object.assign({
            tagId: this._tagId,
            userId: this._userId,
            clientId: this._clientId,
            tagName: this._tagName,
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
                tagId: this._tagId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
            });
        } else if (persistenceType === PersistenceTypes.light && !this.isDirty()) {
            return JSON.stringify({
                tagId: this._tagId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
                tagName: this._tagName,
            });
        } else {
            return this.toSerializedJSON();
        }
    }

    public restore(serializedData: string) { return Tag.fromSerializedJSON(serializedData); }
    public isDirty() { return Object.keys(this._overlay).length > 0; }

    public toCreateDto(): any | ICreateTagDto {
        let dto = {
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            tagName: this._overlay.tagName || this._tagName,
        };
        return dto;
    }

    public toUpdateDto(): any | IUpdateTagDto {
        let dto = {
            tagId: this._tagId,
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            tagName: this._overlay.tagName || this._tagName,
        };
        return dto;
    }
}
