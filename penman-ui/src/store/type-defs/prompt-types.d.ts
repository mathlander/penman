import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { UUID, generateUuid, mergePlainText, mergeRichText } from '../utilities';
import { PrioritizableStorageItem, PersistenceTypes } from './storage-types';

export interface ICreatePromptDto {
    userId: number;
    clientId: UUID;
    eventStart: Date;
    eventEnd: Date;
    title: string;
    body: string;
};

export interface IUpdatePromptDto {
    promptId: number;
    userId: number;
    clientId: UUID;
    eventStart: Date;
    eventEnd: Date;
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
    lastReadAll?: Date;
};

export interface IPrompt extends ICreatePromptDto, IUpdatePromptDto, IDeletePromptDto, IReadPromptDto {
    createdDate: Date;
    modifiedDate: Date;
    isDeleted: boolean;
};

export interface IPromptShadow {
    promptId?: number;
    userId?: number;
    clientId?: UUID;
    eventStart?: Date | null;
    eventEnd?: Date | null;
    title?: string;
    body?: string;
    createdDate?: Date;
    modifiedDate?: Date;
    isDeleted?: boolean;
};

export interface IClientPrompt extends IPrompt {
    clientIdHistory: UUID[];
    handleIdCollision: () => void;
};

export interface IClientPromptShadow extends IPromptShadow {
    // clientIdHistory: UUID[];
};

export interface IPromptCollection {
    prompts: IClientPrompt[];
    lastReadAll: Date;
};

export interface IPromptAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload: any;
    error?: IError;
    memento?: IReplayableAction;
};

export interface IPromptState {
    uuidLookup: Record<UUID, Prompt>;
    prompts: Record<number, Prompt>;
    promptErrorState: IError;
    pendingActions: IPromptAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export const nullPrompt: IPrompt = {
    promptId: 0,
    userId: 0,
    clientId: '',
    eventStart: defaultDate,
    eventEnd: defaultDate,
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
    lastReadAll: defaultDate,
};

export class Prompt extends PrioritizableStorageItem implements IClientPrompt {
    private _promptId: number;
    private _userId: number;
    private _clientId: UUID;
    private _eventStart: Date;
    private _eventEnd: Date;
    private _title: string;
    private _body: string;

    private _createdDate: Date;
    private _modifiedDate: Date;
    private _isDeleted: boolean;

    private _clientIdHistory: UUID[];

    private _overlay: IClientPromptShadow;

    get promptId(): number { this.readAccessed(); return this._overlay.promptId || this._promptId; }
    set promptId(value: number) { this.writeAccessed(); this._overlay.promptId = value; }
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
    get body(): string { this.readAccessed(); return this._overlay.body || this._body; }
    set body(value: string) { this.writeAccessed(); this._overlay.body = value; }

    get createdDate(): Date { this.readAccessed(); return this._overlay.createdDate || this._createdDate; }
    set createdDate(value: Date) { this.writeAccessed(); this._overlay.createdDate = value; }
    get modifiedDate() { this.readAccessed(); return this._overlay.modifiedDate || this._modifiedDate; }
    set modifiedDate(value: Date) { this.writeAccessed(); this._overlay.modifiedDate = value; }
    get isDeleted(): boolean { this.readAccessed(); return this._overlay.isDeleted || this._isDeleted; }
    set isDeleted(value: boolean) { this.writeAccessed(); this._overlay.isDeleted = value; }

    get clientIdHistory(): UUID[] { this.readAccessed(); return this._clientIdHistory; }
    set clientIdHistory(value: UUID[]) { this.writeAccessed(); this._clientIdHistory = value; }

    constructor();
    constructor(prompt: IClientPrompt);
    constructor(prompt?: any) {
        super();
        let now = new Date();
        this._promptId = prompt && prompt.promptId || 0;
        this._userId = prompt && prompt.userId || 0;
        this._clientId = prompt && prompt.clientId || generateUuid();
        this._eventStart = new Date(prompt && prompt.eventStart || now);
        this._eventEnd = new Date(prompt && prompt.eventEnd || now);
        this._title = prompt && prompt.title || '';
        this._body = prompt && prompt.body || '';

        this._createdDate = new Date(prompt && prompt.createdDate || now);
        this._modifiedDate = new Date(prompt && prompt.modifiedDate || now);
        this._isDeleted = prompt && prompt.isDeleted || false;

        this._clientIdHistory = prompt && prompt.clientIdHistory || [this._clientId];

        this._overlay = prompt && prompt.overlay || {};

        // meta data is only present on full load
        this._isPartial = (this._promptId > 0 && this._createdDate.getTime() === now.getTime());
    }

    static fromSerializedJSON(serializedObject: string) {
        return new Prompt(JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return value ? new Date(value) : undefined;
            else return value;
        }));
    }

    public handleIdCollision() {
        const newClientId = generateUuid();
        this._clientId = newClientId;
        this._clientIdHistory.push(newClientId);
    }

    public onApiProcessed(successResponseData: IPrompt, clearOverlay = false) {
        this.writeAccessed();
        if (clearOverlay) {
            // this is the case when an update, originated by the current client, has completed
            // no merge needs to be done
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'promptId') this._promptId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'title') this._title = successResponseData[key];
                else if (key === 'body') this._body = successResponseData[key];
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
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'promptId') this._promptId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'eventStart' && successResponseData[key]) this._eventStart = new Date(successResponseData[key]);
                else if (key === 'eventEnd' && successResponseData[key]) this._eventEnd = new Date(successResponseData[key]);
                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
                else if (key === 'title') {
                    // if the name has been modified, merge
                    if (this._overlay.title) {
                        this._overlay.title = mergePlainText(this._title, this._overlay.title, successResponseData[key]);
                    }
                    // update the base text
                    this._title = successResponseData[key];
                }
                else if (key === 'body') {
                    // if the name has been modified, merge
                    if (this._overlay.body) {
                        this._overlay.body = mergeRichText(this._body, this._overlay.body, successResponseData[key]);
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
            promptId: this._promptId,
            userId: this._userId,
            clientId: this._clientId,
            eventStart: this._eventStart.toISOString(),
            eventEnd: this._eventEnd.toISOString(),
            title: this._title,
            body: this._body,
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
                promptId: this._promptId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
            });
        } else if (persistenceType === PersistenceTypes.light && !this.isDirty()) {
            return JSON.stringify({
                promptId: this._promptId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
                title: this._title,
                eventStart: this._eventStart.toISOString(),
                eventEnd: this._eventEnd.toISOString(),
            });
        } else {
            return this.toSerializedJSON();
        }
    }

    public restore(serializedData: string) { return Prompt.fromSerializedJSON(serializedData); }
    public isDirty() { return Object.keys(this._overlay).length > 0; }

    public toCreateDto(): any | ICreatePromptDto {
        let dto = {
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            eventStart: (this._overlay.eventStart || this._eventStart)?.toISOString(),
            eventEnd: (this._overlay.eventEnd || this._eventEnd)?.toISOString(),
            title: this._overlay.title || this._title,
            body: this._overlay.body || this._body,
        };
        return dto;
    }

    public toUpdateDto(): any | IUpdatePromptDto {
        let dto = {
            promptId: this._promptId,
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            eventStart: (this._overlay.eventStart || this._eventStart)?.toISOString(),
            eventEnd: (this._overlay.eventEnd || this._eventEnd)?.toISOString(),
            title: this._overlay.title || this._title,
            body: this._overlay.body || this._body,
        };
        return dto;
    }
}
