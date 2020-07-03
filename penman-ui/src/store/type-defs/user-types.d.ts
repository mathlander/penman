import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { PrioritizableStorageItem, PersistenceTypes, IStorageManager, StorageRecordType } from './storage-types';
import { UUID, generateUuid } from '../../utilities';
import { IPenmanAction } from './action-types';

export interface ICreateUserDto {
    username: string;
    email: string;
    clientId: UUID;
    password: string;
    firstName: string;
    middleName: string;
    lastName: string;
};

export interface IUpdateProfileDto {
    userId: number;
    username: string;
    email: string;
    firstName: string;
    middleName: string;
    lastName: string;
};

export interface IDeleteUserDto {
    userId: number;
};

export interface IUserProfile {
    userId: number;     // read-only
    username: string;
    email: string;
    clientId: UUID;
    firstName: string;
    middleName: string;
    lastName: string;
    createdDate: Date;
    modifiedDate: Date;
};

export interface IUserProfileShadow {
    userId?: number;
    username?: string;
    email?: string;
    clientId?: UUID;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    createdDate?: Date;
    modifiedDate?: Date;
};

export interface IUserState {
    uuidLookup: Record<UUID, UserProfile>;
    userProfiles: Record<number, UserProfile>;
    userErrorState: IError;
    pendingActions: IPenmanAction[];
    offlineActionQueue: IReplayableAction[];
    lastReadAllDate: Date;
};

export const nullProfile: IUserProfile = {
    userId: 0,
    username: '',
    email: '',
    clientId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    createdDate: defaultDate,
    modifiedDate: defaultDate,
};

export const defaultUserState: IUserState = {
    uuidLookup: {},
    userProfiles: {},
    userErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAllDate: defaultDate,
};

export class UserProfile extends PrioritizableStorageItem implements IUserProfile {
    private _userId: number;
    private _username: string;
    private _email: string;
    private _clientId: UUID;
    private _firstName: string;
    private _middleName: string;
    private _lastName: string;
    private _createdDate: Date;
    private _modifiedDate: Date;

    private _overlay: IUserProfileShadow;

    // cache computed values
    private _weightsByPersistence: Record<PersistenceTypes, number>;
    private _lastSerializedString: string;
    private _lastSerializedTime: number;
    private _lastSerializedPersistenceType: PersistenceTypes;

    get userId(): number {
        this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.userId || this._userId;
    }
    set userId(value: number) {
        this._overlay.userId = value;
        this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    get username(): string {
        this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.username || this._username;
    }
    set username(value: string) {
        this._overlay.username = value;
        this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    get email(): string {
        this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.email || this._email;
    }
    set email(value: string) {
        this._overlay.email = value;
        this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    get clientId(): UUID {
        // reserve this property for the storageManager
        // this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.clientId || this._clientId;
    }
    set clientId(value: UUID) {
        this._overlay.clientId = value;
        // this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    get firstName(): string {
        this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.firstName || this._firstName;
    }
    set firstName(value: string) {
        this._overlay.firstName = value;
        this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    get middleName(): string {
        this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.middleName || this._middleName;
    }
    set middleName(value: string) {
        this._overlay.middleName = value;
        this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    get lastName(): string {
        this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.lastName || this._lastName;
    }
    set lastName(value: string) {
        this._overlay.lastName = value;
        this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    get createdDate(): Date {
        this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.createdDate || this._createdDate;
    }
    set createdDate(value: Date) {
        this._overlay.createdDate = value;
        this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    get modifiedDate(): Date {
        this.readAccessed(StorageRecordType.user, this._clientId);
        return this._overlay.modifiedDate || this._modifiedDate;
    }
    set modifiedDate(value: Date) {
        this._overlay.modifiedDate = value;
        this.writeAccessed(StorageRecordType.user, this._clientId);
    }

    constructor(storageManager: IStorageManager, profile: any) {
        super(storageManager);
        let now = new Date();
        this._userId = profile && profile.userId || 0;
        this._username = profile && profile.username || '';
        this._email = profile && profile.email || '';
        this._clientId = profile && profile.clientId || generateUuid();
        this._firstName = profile && profile.firstName || '';
        this._middleName = profile && profile.middleName || '';
        this._lastName = profile && profile.lastName || '';
        this._createdDate = new Date(profile && profile.createdDate || now);
        this._modifiedDate = new Date(profile && profile.modifiedDate || now);

        this._overlay = profile && profile.overlay || {};

        this._weightsByPersistence = {
            [PersistenceTypes.feather]: -1,
            [PersistenceTypes.light]: -1,
            [PersistenceTypes.heavy]: -1,
        };
        this._lastSerializedString = profile && profile.lastSerializedString || '';
        this._lastSerializedTime = profile && profile.lastSerializedTime || -1;
        this._lastSerializedPersistenceType = profile && profile.lastSerializedPersistenceType || PersistenceTypes.forget;
        if (this._lastSerializedPersistenceType) this._weightsByPersistence[this._lastSerializedPersistenceType] = this._lastSerializedString.length;

        this._isPartial = (this._userId > 0 && this._createdDate.getTime() === now.getTime());
    }

    static fromSerializedJSON(storageManager: IStorageManager, serializedObject: string) {
        return new UserProfile(storageManager, JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date')) return value ? new Date(value) : undefined;
            else if (key === '') {
                value.lastSerializedString = serializedObject;
                value.lastSerializedTime = Date.now();
                value.lastSerializedPersistenceType = persistenceLevel;
            } else return value;
        }));
    }

    public onApiProcessed(successResponseData: IUserProfile, clearOverlay = false) {
        Object.keys(successResponseData).forEach((key: string) => {
            if (key === 'userId') this._userId = successResponseData[key];
            else if (key === 'username') this._username = successResponseData[key];
            else if (key === 'email') this._email = successResponseData[key];
            else if (key === 'clientId') this._clientId = successResponseData[key];
            else if (key === 'firstName') this._firstName = successResponseData[key];
            else if (key === 'middleName') this._middleName = successResponseData[key];
            else if (key === 'lastName') this._lastName = successResponseData[key];
            else if (key === 'createdDate') this._createdDate = new Date(successResponseData[key]);
            else if (key === 'modifiedDate') this._modifiedDate = new Date(successResponseData[key]);
        });
        if (clearOverlay) this._overlay = {};
        this._isPartial = false;
        this.writeAccessed(StorageRecordType.user, this._clientId);
        return this;
    }

    private stringifyOverlay(): string {
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
        switch (persistenceType) {
            case PersistenceTypes.feather:
                serializedObject = JSON.stringify(Object.assign({
                    userId: this._userId,
                    clientId: this._clientId,
                }, (this.isDirty() ? { overlay: this.stringifyOverlay() } : null)));
            case PersistenceTypes.light:
                serializedObject = JSON.stringify(Object.assign({
                    userId: this._userId,
                    username: this._username,
                    email: this._email,
                    clientId: this._clientId,
                    firstName: this._firstName,
                    middleName: this._middleName,
                    lastName: this._lastName,
                }, (this.isDirty() ? { overlay: this.stringifyOverlay() } : null)));
            case PersistenceTypes.heavy:
                serializedObject = JSON.stringify(Object.assign({
                    userId: this._userId,
                    username: this._username,
                    email: this._email,
                    clientId: this._clientId,
                    firstName: this._firstName,
                    middleName: this._middleName,
                    lastName: this._lastName,
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
        return Object.assign({
            username: this._username,
            email: this._email,
            password: 'must-be-replaced',
            clientId: this._clientId,
            firstName: this._firstName,
            middleName: this._middleName,
            lastName: this._lastName,
        }, this._overlay);
    }

    public toUpdateDto(): any {
        return Object.assign({
            userId: this._userId,
            username: this._username,
            email: this._email,
            password: 'must-be-replaced',
            clientId: this._clientId,
            firstName: this._firstName,
            middleName: this._middleName,
            lastName: this._lastName,
        }, this._overlay);
    }
}
