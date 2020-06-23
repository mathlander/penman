import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { UUID, generateUuid, mergePlainText, mergeRichText } from '../utilities';
import { PrioritizableStorageItem, PersistenceTypes } from './storage-types';

export interface ICreateRelationshipDto {
    userId: number;
    clientId: UUID;
    objectClientId: UUID;
    chipClientId: UUID;
};

export interface IUpdateRelationshipDto {
    relationshipId: number;
    userId: number;
    objectClientId: UUID;
    chipClientId: UUID;
};

export interface IDeleteRelationshipDto {
    relationshipId: number;
};

export interface IReadRelationshipDto {
    relationshipId: number;
};

export interface IReadAllRelationshipsDto {
    userId: number;
    lastReadAll?: Date;
};

export interface IRelationship extends ICreateRelationshipDto, IUpdateRelationshipDto, IDeleteRelationshipDto, IReadRelationshipDto {
    createdDate: Date;
    modifiedDate: Date;
    isDeleted: boolean;
};

export interface IRelationshipShadow {
    relationshipId?: number;
    userId?: number;
    clientId?: UUID;
    objectClientId?: UUID;
    chipClientId?: UUID;
    createdDate?: Date;
    modifiedDate?: Date;
    isDeleted?: boolean;
};

export interface IClientRelationship extends IRelationship {
    clientIdHistory: UUID[];
    handleIdCollision: () => void;
};

export interface IClientRelationshipShadow extends IRelationshipShadow {
    // clientIdHistory: UUID[];
};

export interface IRelationshipCollection {
    relationships: IClientRelationship[];
    lastReadAll: Date;
};

export interface IRelationshipAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload: any;
    error?: IError;
    memento?: IReplayableAction;
};

export interface IRelationshipState {
    uuidLookup: Record<UUID, Relationship>;
    relationships: Record<number, Relationship>;
    objectUuidLookup: Record<UUID, Record<number, Relationship>>;
    chipUuidLookup: Record<UUID, Record<number, Relationship>>;
    relationshipErrorState: IError;
    pendingActions: IRelationshipAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export const nullRelationship: IRelationship = {
    relationshipId: 0,
    userId: 0,
    clientId: '',
    objectClientId: '',
    chipClientId: '',

    createdDate: defaultDate,
    modifiedDate: defaultDate,
    isDeleted: false,
};

export const defaultRelationshipState: IRelationshipState = {
    uuidLookup: {},
    relationships: {},
    relationshipErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAll: defaultDate,
};

export class Relationship extends PrioritizableStorageItem implements IClientRelationship {
    private _relationshipId: number;
    private _userId: number;
    private _clientId: UUID;
    private _objectClientId: UUID;
    private _chipClientId: UUID;

    private _createdDate: Date;
    private _modifiedDate: Date;
    private _isDeleted: boolean;

    private _clientIdHistory: UUID[];

    private _overlay: IClientRelationshipShadow;

    get relationshipId(): number { this.readAccessed(); return this._overlay.relationshipId || this._relationshipId; }
    set relationshipId(value: number) { this.writeAccessed(); this._overlay.relationshipId = value; }
    get userId(): number { this.readAccessed(); return this._overlay.userId || this._userId; }
    set userId(value: number) { this.writeAccessed(); this._overlay.userId = value; }
    get clientId(): UUID { this.readAccessed(); return this._overlay.clientId || this._clientId; }
    set clientId(value: UUID) { this.writeAccessed(); this._overlay.clientId = value; }
    get objectClientId(): UUID { this.readAccessed(); return this._overlay.objectClientId || this._objectClientId; }
    set objectClientId(value: UUID) { this.writeAccessed(); this._overlay.objectClientId = value; }
    get chipClientId(): UUID { this.readAccessed(); return this._overlay.chipClientId || this._chipClientId; }
    set chipClientId(value: UUID) { this.writeAccessed(); this._overlay.chipClientId = value; }

    get createdDate(): Date { this.readAccessed(); return this._overlay.createdDate || this._createdDate; }
    set createdDate(value: Date) { this.writeAccessed(); this._overlay.createdDate = value; }
    get modifiedDate() { this.readAccessed(); return this._overlay.modifiedDate || this._modifiedDate; }
    set modifiedDate(value: Date) { this.writeAccessed(); this._overlay.modifiedDate = value; }
    get isDeleted(): boolean { this.readAccessed(); return this._overlay.isDeleted || this._isDeleted; }
    set isDeleted(value: boolean) { this.writeAccessed(); this._overlay.isDeleted = value; }

    get clientIdHistory(): UUID[] { this.readAccessed(); return this._clientIdHistory; }
    set clientIdHistory(value: UUID[]) { this.writeAccessed(); this._clientIdHistory = value; }

    constructor();
    constructor(relationship: IClientRelationship);
    constructor(relationship?: any) {
        super();
        let now = new Date();
        this._relationshipId = relationship && relationship.relationshipId || 0;
        this._userId = relationship && relationship.userId || 0;
        this._clientId = relationship && relationship.clientId || generateUuid();
        this._objectClientId = relationship && relationship.objectClientId || '';
        this._chipClientId = relationship && relationship.chipClientId || '';

        this._createdDate = new Date(relationship && relationship.createdDate || now);
        this._modifiedDate = new Date(relationship && relationship.modifiedDate || now);
        this._isDeleted = relationship && relationship.isDeleted || false;

        this._clientIdHistory = relationship && relationship.clientIdHistory || [this._clientId];

        this._overlay = relationship && relationship.overlay || {};

        // meta data is only present on full load
        this._isPartial = (this._relationshipId > 0 && this._createdDate.getTime() === now.getTime());
    }

    static fromSerializedJSON(serializedObject: string) {
        return new Relationship(JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return value ? new Date(value) : undefined;
            else return value;
        }));
    }

    public handleIdCollision() {
        const newClientId = generateUuid();
        this._clientId = newClientId;
        this._clientIdHistory.push(newClientId);
    }

    public onApiProcessed(successResponseData: IRelationship, clearOverlay = false) {
        this.writeAccessed();
        if (clearOverlay) {
            // this is the case when an update, originated by the current client, has completed
            // no merge needs to be done
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'relationshipId') this._relationshipId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'objectClientId') this._objectClientId = successResponseData[key];
                else if (key === 'chipClientId') this._chipClientId = successResponseData[key];

                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
            });
            this._overlay = {};
        } else {
            // this is the case when an update, originated by a collaborator, has been pushed
            // to the current client and updates must be merged
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'relationshipId') this._relationshipId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'objectClientId') this._objectClientId = successResponseData[key];
                else if (key === 'chipClientId') this._chipClientId = successResponseData[key];
                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
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
            relationshipId: this._relationshipId,
            userId: this._userId,
            clientId: this._clientId,
            objectClientId: this._objectClientId,
            chipClientId: this._chipClientId,
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
        } else if ((persistenceType === PersistenceTypes.feather || persistenceType === PersistenceTypes.light) && !this.isDirty()) {
            return JSON.stringify({
                relationshipId: this._relationshipId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
                objectClientId: this._objectClientId,
                chipClientId: this._chipClientId,
            });
        } else {
            return this.toSerializedJSON();
        }
    }

    public restore(serializedData: string) { return Relationship.fromSerializedJSON(serializedData); }
    public isDirty() { return Object.keys(this._overlay).length > 0; }

    public toCreateDto(): any | ICreateRelationshipDto {
        let dto = {
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            objectClientId: this._overlay.objectClientId || this._objectClientId,
            chipClientId: this._overlay.chipClientId || this._chipClientId,
        };
        return dto;
    }

    public toUpdateDto(): any | IUpdateRelationshipDto {
        let dto = {
            relationshipId: this._relationshipId,
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            objectClientId: this._overlay.objectClientId || this._objectClientId,
            chipClientId: this._overlay.chipClientId || this._chipClientId,
        };
        return dto;
    }
}
