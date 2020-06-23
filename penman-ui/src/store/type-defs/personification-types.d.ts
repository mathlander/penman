import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { UUID, generateUuid, mergePlainText, mergeRichText } from '../utilities';
import { PrioritizableStorageItem, PersistenceTypes } from './storage-types';

export interface ICreatePersonificationDto {
    userId: number;
    clientId: UUID;
    firstName: string;
    middleName: string;
    lastName: string;
    birthday: Date;
};

export interface IUpdatePersonificationDto {
    personificationId: number;
    userId: number;
    clientId: UUID;
    firstName: string;
    middleName: string;
    lastName: string;
    birthday: Date;
};

export interface IDeletePersonificationDto {
    personificationId: number;
};

export interface IReadPersonificationDto {
    personificationId: number;
};

export interface IReadAllPersonificationsDto {
    userId: number;
    lastReadAll?: Date;
};

export interface IPersonification extends ICreatePersonificationDto, IUpdatePersonificationDto, IDeletePersonificationDto, IReadPersonificationDto {
    createdDate: Date;
    modifiedDate: Date;
    isDeleted: boolean;
};

export interface IPersonificationShadow {
    personificationId?: number;
    userId?: number;
    clientId?: UUID;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    birthday?: Date;
    createdDate?: Date;
    modifiedDate?: Date;
    isDeleted?: boolean;
};

export interface IClientPersonification extends IPersonification {
    clientIdHistory: UUID[];
    handleIdCollision: () => void;
};

export interface IClientPersonificationShadow extends IPersonificationShadow {
    // clientIdHistory: UUID[];
}

export interface IPersonificationCollection {
    personifications: IClientPersonification[];
    lastReadAll: Date;
};

export interface IPersonificationAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload: any;
    error?: IError;
    memento?: IReplayableAction;
};

export interface IPersonificationState {
    uuidLookup: Record<UUID, Personification>;
    personifications: Record<number, Personification>;
    personificationErrorState: IError;
    pendingActions: IPersonificationAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAll: Date;
};

export const nullPersonification: IPersonification = {
    personificationId: 0,
    userId: 0,
    clientId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    birthday: defaultDate,

    createdDate: defaultDate,
    modifiedDate: defaultDate,
    isDeleted: false,
};

export const defaultPersonificationState: IPersonificationState = {
    uuidLookup: {},
    personifications: {},
    personificationErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAll: defaultDate,
};

export class Personification extends PrioritizableStorageItem implements IClientPersonification {
    private _personificationId: number;
    private _userId: number;
    private _clientId: UUID;
    private _firstName: string;
    private _middleName: string;
    private _lastName: string;
    private _birthday: Date;

    private _createdDate: Date;
    private _modifiedDate: Date;
    private _isDeleted: boolean;

    private _clientIdHistory: UUID[];

    private _overlay: IClientPersonificationShadow;

    get personificationId(): number { this.readAccessed(); return this._overlay.personificationId || this._personificationId; }
    set personificationId(value: number) { this.writeAccessed(); this._overlay.personificationId = value; }
    get userId(): number { this.readAccessed(); return this._overlay.userId || this._userId; }
    set userId(value: number) { this.writeAccessed(); this._overlay.userId = value; }
    get clientId(): UUID { this.readAccessed(); return this._overlay.clientId || this._clientId; }
    set clientId(value: UUID) { this.writeAccessed(); this._overlay.clientId = value; }
    get firstName(): string { this.readAccessed(); return this._overlay.firstName || this._firstName; }
    set firstName(value: string) { this.writeAccessed(); this._overlay.firstName = value; }
    get middleName(): string { this.readAccessed(); return this._overlay.middleName || this._middleName; }
    set middleName(value: string) { this.writeAccessed(); this._overlay.middleName = value; }
    get lastName(): string { this.readAccessed(); return this._overlay.lastName || this._lastName; }
    set lastName(value: string) { this.writeAccessed(); this._overlay.lastName = value; }
    get birthday(): Date { this.readAccessed(); return this._overlay.birthday || this._birthday; }
    set birthday(value: Date) { this.writeAccessed(); this._overlay.birthday = value; }

    get createdDate(): Date { this.readAccessed(); return this._overlay.createdDate || this._createdDate; }
    set createdDate(value: Date) { this.writeAccessed(); this._overlay.createdDate = value; }
    get modifiedDate() { this.readAccessed(); return this._overlay.modifiedDate || this._modifiedDate; }
    set modifiedDate(value: Date) { this.writeAccessed(); this._overlay.modifiedDate = value; }
    get isDeleted(): boolean { this.readAccessed(); return this._overlay.isDeleted || this._isDeleted; }
    set isDeleted(value: boolean) { this.writeAccessed(); this._overlay.isDeleted = value; }

    get clientIdHistory(): UUID[] { this.readAccessed(); return this._clientIdHistory; }
    set clientIdHistory(value: UUID[]) { this.writeAccessed(); this._clientIdHistory = value; }

    constructor();
    constructor(personification: IClientPersonification);
    constructor(personification?: any) {
        super();
        let now = new Date();
        this._personificationId = personification && personification.personificationId || 0;
        this._userId = personification && personification.userId || 0;
        this._clientId = personification && personification.clientId || generateUuid();
        this._firstName = personification && personification.firstName || '';
        this._middleName = personification && personification.middleNow || '';
        this._lastName = personification && personification.lastName || '';
        this._birthday = new Date(personification && personification.birthday || now);

        this._createdDate = new Date(personification && personification.createdDate || now);
        this._modifiedDate = new Date(personification && personification.modifiedDate || now);
        this._isDeleted = personification && personification.isDeleted || false;

        this._clientIdHistory = personification && personification.clientIdHistory || [this._clientId];

        this._overlay = personification && personification.overlay || {};

        // meta data is only present on full load
        this._isPartial = (this._personificationId > 0 && this._createdDate.getTime() === now.getTime());
    }

    static fromSerializedJSON(serializedObject: string) {
        return new Personification(JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd' || key === 'birthday') return value ? new Date(value) : undefined;
            else return value;
        }));
    }

    public handleIdCollision() {
        const newClientId = generateUuid();
        this._clientId = newClientId;
        this._clientIdHistory.push(newClientId);
    }

    public onApiProcessed(successResponseData: IPersonification, clearOverlay = false) {
        this.writeAccessed();
        if (clearOverlay) {
            // this is the case when an update, originated by the current client, has completed
            // no merge needs to be done
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'personificationId') this._personificationId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'firstName') this._firstName = successResponseData[key];
                else if (key === 'middleName') this._middleName = successResponseData[key];
                else if (key === 'lastName') this._lastName = successResponseData[key];
                else if (key === 'birthday' && successResponseData[key]) this._birthday = new Date(successResponseData[key]);

                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
            });
            this._overlay = {};
        } else {
            // this is the case when an update, originated by a collaborator, has been pushed
            // to the current client and updates must be merged
            Object.keys(successResponseData).forEach((key: string) => {
                if (key === 'personificationId') this._personificationId = successResponseData[key];
                else if (key === 'userId') this._userId = successResponseData[key];
                else if (key === 'clientId') this._clientId = successResponseData[key];
                else if (key === 'birthday' && successResponseData[key]) this._birthday = new Date(successResponseData[key]);
                else if (key === 'createdDate' && successResponseData[key]) this._createdDate = new Date(successResponseData[key]);
                else if (key === 'modifiedDate' && successResponseData[key]) this._modifiedDate = new Date(successResponseData[key]);
                else if (key === 'isDeleted' && successResponseData[key]) this._isDeleted = successResponseData[key];
                else if (key === 'firstName') {
                    // if the name has been modified, merge
                    if (this._overlay.firstName) {
                        this._overlay.firstName = mergePlainText(this._firstName, this._overlay.firstName, successResponseData[key]);
                    }
                    // update the base text
                    this._firstName = successResponseData[key];
                }
                else if (key === 'middleName') {
                    // if the name has been modified, merge
                    if (this._overlay.middleName) {
                        this._overlay.middleName = mergePlainText(this._middleName, this._overlay.middleName, successResponseData[key]);
                    }
                    // update the base text
                    this._middleName = successResponseData[key];
                }
                else if (key === 'lastName') {
                    // if the name has been modified, merge
                    if (this._overlay.lastName) {
                        this._overlay.lastName = mergePlainText(this._lastName, this._overlay.lastName, successResponseData[key]);
                    }
                    // update the base text
                    this._lastName = successResponseData[key];
                }
            });
        }
        this._isPartial = false;
        return this;
    }

    private stringifyOverlay(): string | null {
        if (!this.isDirty()) return null;
        return JSON.stringify(this._overlay, (key, value) => {
            if (key.endsWith('Date') || key === 'birthday') return value.toISOString();
            else return value;
        });
    }

    public toSerializedJSON() {
        return JSON.stringify(Object.assign({
            personificationId: this._personificationId,
            userId: this._userId,
            clientId: this._clientId,
            firstName: this._firstName,
            middleName: this._middleName,
            lastName: this._lastName,
            birthday: this._birthday.toISOString(),
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
                personificationId: this._personificationId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
            });
        } else if (persistenceType === PersistenceTypes.light && !this.isDirty()) {
            return JSON.stringify({
                personificationId: this._personificationId,
                clientId: this._clientId,
                clientIdHistory: this._clientIdHistory,
                firstName: this._firstName,
                middleName: this._middleName,
                lastName: this._lastName,
                birthday: this._birthday.toISOString(),
            });
        } else {
            return this.toSerializedJSON();
        }
    }

    public restore(serializedData: string) { return Personification.fromSerializedJSON(serializedData); }
    public isDirty() { return Object.keys(this._overlay).length > 0; }

    public toCreateDto(): any | ICreatePersonificationDto {
        let dto = {
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            firstName: this._overlay.firstName || this._firstName,
            middleName: this._overlay.middleName || this._middleName,
            lastName: this._overlay.lastName || this._lastName,
            birthday: (this._overlay.birthday || this._birthday)?.toISOString(),
        };
        return dto;
    }

    public toUpdateDto(): any | IUpdatePersonificationDto {
        let dto = {
            personificationId: this._personificationId,
            userId: this._overlay.userId || this._userId,
            clientId: this._overlay.clientId || this._clientIdHistory,
            firstName: this._overlay.firstName || this._firstName,
            middleName: this._overlay.middleName || this._middleName,
            lastName: this._overlay.lastName || this._lastName,
            birthday: (this._overlay.birthday || this._birthday)?.toISOString(),
        };
        return dto;
    }
}
