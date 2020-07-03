import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { PrioritizableStorageItem, PersistenceTypes, IStorageManager, StorageRecordType } from './storage-types';
import { UUID, generateUuid } from '../../utilities';
import { IPenmanAction } from './action-types';
import { mergePlainText, mergeRichText } from '../algorithms/mergeManager';

export interface ICreatePromptDto {
    userId: number;
    clientId: UUID;
    eventStartDate: Date;
    eventEndDate: Date;
    title: string;
    body: string;
};

export interface IUpdatePromptDto {
    promptId: number;
    userId: number;
    clientId: UUID;
    eventStartDate: Date;
    eventEndDate: Date;
    title: string;
    body: string;
};

export interface IDeletePromptDto {
    promptId: number;
};

export interface IReadPromptDto {
    promptId: number;
};

export interface IReadAllPromptsDto {
    userId: number;
    lastReadAllDate?: Date;
};

export interface IPrompt {
    promptId: number;
    userId: number;
    clientId: UUID;
    eventStartDate: Date;
    eventEndDate: Date;
    title: string;
    body: string;
    createdDate: Date;
    modifiedDate: Date;
    isDeleted: boolean;
};

export interface IPromptShadow {
    promptId?: number;
    userId?: number;
    clientId?: UUID;
    eventStartDate?: Date;
    eventEndDate?: Date;
    title?: string;
    body?: string;
    createdDate?: Date;
    modifiedDate?: Date;
    isDeleted?: boolean;
};

export interface IPromptCollection {
    prompts: IPrompt[];
    lastReadAllDate: Date;
};

export interface IPromptState {
    uuidLookup: Record<UUID, Prompt>;
    prompts: Record<number, Prompt>;
    promptErrorState: IError;
    pendingActions: IPenmanAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAllDate: Date;
};

export const nullPrompt: IPrompt = {
    promptId: 0,
    userId: 0,
    clientId: '',
    eventStartDate: defaultDate,
    eventEndDate: defaultDate,
    title: '',
    body: '',
    createdDate: defaultDate,
    modifiedDate: defaultDate,
    isDeleted: false,
};

export const defaultPromptState: IPromptState = {
    uuidLookup: {},
    prompts: {},
    promptErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAllDate: defaultDate,
};

export class Prompt extends PrioritizableStorageItem implements IPrompt {
    private _promptId: number;
    private _userId: number;
    private _clientId: UUID;
    private _eventStartDate: Date;
    private _eventEndDate: Date;
    private _title: string;
    private _body: string;
    private _createdDate: Date;
    private _modifiedDate: Date;
    private _isDeleted: boolean;

    private _clientIdHistory: UUID[];
    private _overlay: IPromptShadow;

    // cache computed values
    private _weightsByPersistence: Record<PersistenceTypes, number>;
    private _lastSerializedString: string;
    private _lastSerializedTime: number;
    private _lastSerializedPersistenceType: PersistenceTypes;

    get promptId(): number {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.promptId || this._promptId;
    }
    set promptId(value: number) {
        this._overlay.promptId = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get userId(): number {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.userId || this._userId;
    }
    set userId(value: number) {
        this._overlay.userId = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get clientId(): UUID {
        // reserve this property for the storageManager
        // this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.clientId || this._clientId;
    }
    set clientId(value: UUID) {
        this._overlay.clientId = value;
        // this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get eventStartDate(): Date {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.eventStartDate || this._eventStartDate;
    }
    set eventStartDate(value: Date) {
        this._overlay.eventStartDate = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get eventEndDate(): Date {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.eventEndDate || this._eventEndDate;
    }
    set eventEndDate(value: Date) {
        this._overlay.eventEndDate = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get title(): string {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.title || this._title;
    }
    set title(value: string) {
        this._overlay.title = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get body(): string {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.body || this._body;
    }
    set body(value: string) {
        this._overlay.body = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get createdDate(): Date {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.createdDate || this._createdDate;
    }
    set createdDate(value: Date) {
        this._overlay.createdDate = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get modifiedDate(): Date {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.modifiedDate || this._modifiedDate;
    }
    set modifiedDate(value: Date) {
        this._overlay.modifiedDate = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get isDeleted(): boolean {
        this.readAccessed(StorageRecordType.prompt, this._clientId);
        return this._overlay.isDeleted || this._isDeleted;
    }
    set isDeleted(value: boolean) {
        this._overlay.isDeleted = value;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
    }

    get clientIdHistory(): UUID[] { return this._clientIdHistory.slice(); }

    constructor(storageManger: IStorageManager, prompt: any) {
        super(storageManger);
        let now = new Date();
        this._promptId = prompt && prompt.promptId || 0;
        this._userId = prompt && prompt.userId || 0;
        this._clientId = prompt && prompt.clientId || generateUuid();
        this._eventStartDate = new Date(prompt && prompt.eventStartDate || now);
        this._eventEndDate = new Date(prompt && prompt.eventEndDate || now);
        this._title = prompt && prompt.title || '';
        this._body = prompt && prompt.body || '';
        this._createdDate = new Date(prompt && prompt.createdDate || now);
        this._modifiedDate = new Date(prompt && prompt.modifiedDate || now);
        this._isDeleted = prompt && prompt.isDeleted || false;

        this._clientIdHistory = prompt && prompt.clientIdHistory || [this._clientId];
        this._overlay = prompt && prompt.overlay || {};

        this._weightsByPersistence = {
            [PersistenceTypes.feather]: -1,
            [PersistenceTypes.light]: -1,
            [PersistenceTypes.heavy]: -1,
        };
        this._lastSerializedString = profile && profile.lastSerializedString || '';
        this._lastSerializedTime = profile && profile.lastSerializedTime || -1;
        this._lastSerializedPersistenceType = profile && profile.lastSerializedPersistenceType || PersistenceTypes.forget;
        if (this._lastSerializedPersistenceType) this._weightsByPersistence[this._lastSerializedPersistenceType] = this._lastSerializedString.length;

        // meta data is only present on full load
        this._isPartial = (this._promptId > 0 && this._createdDate.getTime() === now.getTime());
    }

    static fromSerializedJSON(storageManager: IStorageManager, serializedObject: string) {
        return new Prompt(storageManager, JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date')) return value ? new Date(value) : undefined;
            else return value;
        }));
    }

    public handleIdCollision() {
        const newClientId = generateUuid();
        this._clientId = newClientId;
        this._clientIdHistory.push(newClientId);
    }

    public onApiProcessed(successResponseData: IPrompt, clearOverlay = false) {
        Object.keys(successResponseData).forEach((key: string) => {
            if (key === 'promptId') this._promptId = successResponseData[key];
            else if (key === 'userId') this._userId = successResponseData[key];
            else if (key === 'eventStartDate') this._eventStartDate = new Date(successResponseData[key]);
            else if (key === 'eventEndDate') this._eventEndDate = new Date(successResponseData[key]);
            else if (key === 'createdDate') this._createdDate = new Date(successResponseData[key]);
            else if (key === 'modifiedDate') this._modifiedDate = new Date(successResponseData[key]);
            else if (key === 'isDeleted') this._isDeleted = successResponseData[key];
            else if (key === 'title') {
                // if the title has been modified and we are not clearing the overlay, merge
                if (!clearOverlay && this._overlay.title) {
                    this._overlay.title = mergePlainText(this._title, this._overlay.title, successResponseData[key]);
                }
                // update the base text
                this._title = successResponseData[key];
            } else if (key === 'body') {
                // if the body has been modified and we are not clearing the overlay, merge
                if (!clearOverlay && this._overlay.body) {
                    this._overlay.body = mergeRichText(this._body, this._overlay.body, successResponseData[key]);
                }
                // update the base text
                this._body = successResponseData[key];
            }
        });
        if (clearOverlay) this._overlay = {};
        this._isPartial = false;
        this.writeAccessed(StorageRecordType.prompt, this._clientId);
        return this;
    }

    public stringifyOverlay(): string {
        if (!this.isDirty()) return '';
        return JSON.stringify(this._overlay, (key, value) => {
            if (key.endsWith('Date')) return value.toISOString();
            else return value;
        });
    }

    public serialize(persistenceType: PersistenceTypes = PersistenceTypes.heavy) {
        // check to see if we can re-use a cached result
        if (this.lastWriteAccessTime < this._lastSerializedTime && persistenceType === this._lastSerializedPersistenceType) {
            return this._lastSerializedString;
        }
        // otherwise...
        let serializedObject = '';
        let overlayedOrigins = Object.keys(this._overlay).reduce((previousValue: IPromptShadow, currentKey: string) => {
            if (currentKey === 'promptId') previousValue[currentKey] = this._promptId;
            else if (currentKey === 'userId') previousValue[currentKey] = this._userId;
            else if (currentKey === 'clientId') previousValue[currentKey] = this._clientId;
            else if (currentKey === 'eventStartDate') previousValue[currentKey] = this._eventStartDate.toISOString();
            else if (currentKey === 'eventEndDate') previousValue[currentKey] = this._eventEndDate.toISOString();
            else if (currentKey === 'title') previousValue[currentKey] = this._title;
            else if (currentKey === 'body') previousValue[currentKey] = this._body;
            return previousValue;
        }, {});
        if (this._clientIdHistory.length > 1) overlayedOrigins['clientIdHistory'] = this._clientIdHistory;
        switch (persistenceType) {
            case PersistenceTypes.feather:
                serializedObject = JSON.stringify(Object.assign({
                    promptId: this._promptId,
                    userId: this._userId,
                    clientId: this._clientId,
                }, overlayedOrigins, (this.isDirty() ? { overlay: this.stringifyOverlay() } : null)));
            case PersistenceTypes.light:
                serializedObject = JSON.stringify(Object.assign({
                    promptId: this._promptId,
                    userId: this._userId,
                    clientId: this._clientId,
                    eventStartDate: this._eventStartDate.toISOString(),
                    eventEndDate: this._eventEndDate.toISOString(),
                    title: this._title,
                    body: this._body,
                }, overlayedOrigins, (this.isDirty() ? { overlay: this.stringifyOverlay() } : null)));
            case PersistenceTypes.heavy:
                serializedObject = JSON.stringify(Object.assign({
                    promptId: this._promptId,
                    userId: this._userId,
                    clientId: this._clientId,
                    eventStartDate: this._eventStartDate.toISOString(),
                    eventEndDate: this._eventEndDate.toISOString(),
                    title: this._title,
                    body: this._body,
                    createdDate: this._createdDate.toISOString(),
                    modifiedDate: this._modifiedDate.toISOString(),
                }, (this.isDirty() ? { overlay: this.stringifyOverlay() } : null)));
            default:
                break;
        }
        this._weightsByPersistence[persistenceType] = serializedObject.length;
        this._lastSerializedString = serializedObject;
        this._lastSerializedTime = Date.now();
        this._lastSerializedPersistenceType = persistenceType;
        return serializedObject;
    }

    public computeWeight(persistenceType: PersistenceTypes = PersistenceTypes.heavy) {
        // serialize takes care of checking for cached results
        return this.serialize(persistenceType).length;
    }

    public isDirty() { return Object.keys(this._overlay).length > 0; }

    public toCreateDto(): any {
        const dto = Object.assign({
            userId: this._userId,
            clientId: this._clientId,
            eventStartDate: this._eventStartDate,
            eventEndDate: this._eventEndDate,
            title: this._title,
            body: this._body,
        }, this._overlay);
        dto.eventStartDate = dto.eventStartDate.toISOString();
        dto.eventEndDate = dto.eventEndDate.toISOString();
        return dto;
    }

    public toUpdateDto(): any {
        const dto = Object.assign({
            promptId: this._promptId,
            userId: this._userId,
            clientId: this._clientId,
            eventStartDate: this._eventStartDate,
            eventEndDate: this._eventEndDate,
            title: this._title,
            body: this._body,
        }, this._overlay);
        dto.eventStartDate = dto.eventStartDate.toISOString();
        dto.eventEndDate = dto.eventEndDate.toISOString();
        return dto;
    }
}
