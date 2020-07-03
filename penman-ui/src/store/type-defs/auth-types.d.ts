import { defaultDate } from '../../constants';
import { IReplayableAction, IReplayUser } from './offline-types';
import { IError, nullError } from './error-types';
import { PrioritizableStorageItem, PersistenceTypes, StorageRecordType, IStorageManager } from './storage-types';
import { IUserProfile, IUserProfileShadow } from './user-types';
import { UUID, generateUuid } from '../../utilities';
import { IPenmanAction } from './action-types';

export interface IAuthDto {
    username: string;
    password: string;
};

export interface IRefreshDto {
    refreshToken: string;
};

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

export interface IUpdatePasswordDto {
    userId: number;
    password: string;
};

// export interface IDeleteUserDto {
//     userId: number;
// };

// export interface IUserProfile {
//     userId: number;
//     username: string;
//     email: string;
//     clientId: UUID;
//     firstName: string;
//     middleName: string;
//     lastName: string;
//     createdDate: Date;
//     modifiedDate: Date;
// };

export interface IAuthenticatedUser {
    token: string;
    refreshToken: string;
    tokenExpirationDate: Date;
    refreshTokenExpirationDate: Date;
    profile: IUserProfile;
    clientId: UUID;
};

// export interface IUserProfileShadow {
//     userId?: number;
//     username?: string;
//     email?: string;
//     clientId?: UUID;
//     firstName?: string;
//     middleName?: string;
//     lastName?: string;
//     createdDate?: Date;
//     modifiedDate?: Date;
// };

export interface IAuthenticatedUserShadow {
    token?: string;
    refreshToken?: string;
    tokenExpirationDate?: Date;
    refreshTokenExpirationDate?: Date;
    profile?: IUserProfileShadow;
};

export interface IAuthenticationState {
    authenticatedUser: AuthenticatedUser;
    authErrorState: IError;
    pendingActions: IPenmanAction[];
    offlineActionQueue: IReplayableAction[];
};

export const nullUser: any = {
    token: '',
    refreshToken: '',
    tokenExpirationDate: defaultDate,
    refreshTokenExpirationDate: defaultDate,

    profile: {
        userId: 0,
        username: '',
        email: '',
        clientId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        createdDate: defaultDate,
        modifiedDate: defaultDate,
    },
};

export const defaultAuthenticationState: IAuthenticationState = {
    authenticatedUser: nullUser,
    authErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
};

export class AuthenticatedUser extends PrioritizableStorageItem implements IAuthenticatedUser {
    private _token: string;
    private _refreshToken: string;
    private _tokenExpirationDate: Date;
    private _refreshTokenExpirationDate: Date;
    private _profile: IUserProfile;

    private _overlay: IAuthenticatedUserShadow;

    // cache computed values
    private _weightsByPersistence: Record<PersistenceTypes, number>;
    private _lastSerializedString: string;
    private _lastSerializedTime: number;
    private _lastSerializedPersistenceType: PersistenceTypes;

    get token(): string {
        this.readAccessed(StorageRecordType.authentication, this._profile.clientId);
        return this._overlay.token || this._token;
    }
    set token(value: string) {
        this._overlay.token = value;
        this.writeAccessed(StorageRecordType.authentication, this._profile.clientId);
    }

    get refreshToken(): string {
        this.readAccessed(StorageRecordType.authentication, this._profile.clientId);
        return this._overlay.refreshToken || this._refreshToken;
    }
    set refreshToken(value: string) {
        this._overlay.refreshToken = value;
        this.writeAccessed(StorageRecordType.authentication, this._profile.clientId);
    }

    get tokenExpirationDate(): Date {
        this.readAccessed(StorageRecordType.authentication, this._profile.clientId);
        return this._overlay.tokenExpirationDate || this._tokenExpirationDate;
    }
    set tokenExpirationDate(value: Date) {
        this._overlay.tokenExpirationDate = value;
        this.writeAccessed(StorageRecordType.authentication, this._profile.clientId);
    }

    get refreshTokenExpirationDate(): Date {
        this.readAccessed(StorageRecordType.authentication, this._profile.clientId);
        return this._overlay.refreshTokenExpirationDate || this._refreshTokenExpirationDate;
    }
    set refreshTokenExpirationDate(value: Date) {
        this._overlay.refreshTokenExpirationDate = value;
        this.writeAccessed(StorageRecordType.authentication, this._profile.clientId);
    }

    get profile(): IUserProfile {
        this.readAccessed(StorageRecordType.authentication, this._profile.clientId);
        return this._overlay.profile || this._profile;
    }
    set profile(value: IUserProfile) {
        this._overlay.profile = value;
        this.writeAccessed(StorageRecordType.authentication, this._profile.clientId);
    }

    get clientId(): UUID {
        // reserve this property for the storageManager
        // this.readAccessed(StorageRecordType.authentication, this._profile.clientId);
        return this._overlay.profile?.clientId || this._profile.clientId;
    }
    set client(value: UUID) {
        if (!this._overlay.profile) this._overlay.profile = { clientId: value };
        else this._overlay.profile.clientId = value;
        // this.writeAccessed(StorageRecordType.authentication, this._profile.clientId);
    }

    constructor(storageManager: IStorageManager, user: any) {
        super(storageManager);
        let now = new Date();
        this._token = user && user.token || '';
        this._refreshToken = user && user.refreshToken || '';
        this._tokenExpirationDate = new Date(user && user.tokenExpirationDate || now);
        this._refreshTokenExpirationDate = new Date(user && user.refreshTokenExpirationDate || now);
        this._profile = user && user.profile || {
            userId: '',
            username: '',
            email: '',
            clientId: generateUuid(),
            firstName: '',
            middleName: '',
            lastName: '',
            createdDate: now,
            modifiedDate: now,
        };
        this._profile.createdDate = new Date(this._profile.createdDate);
        this._profile.modifiedDate = new Date(this._profile.modifiedDate);

        this._overlay = user && user.overlay || {};

        this._weightsByPersistence = {
            [PersistenceTypes.feather]: -1,
            [PersistenceTypes.light]: -1,
            [PersistenceTypes.heavy]: -1,
        };
        this._lastSerializedString = user && user.lastSerializedString || '';
        this._lastSerializedTime = user && user.lastSerializedTime || -1;
        this._lastSerializedPersistenceType = user && user.lastSerializedPersistenceType || PersistenceTypes.forget;
        if (this._lastSerializedPersistenceType) this._weightsByPersistence[this._lastSerializedPersistenceType] = this._lastSerializedString.length;

        this._isPartial = false;
    }

    static fromSerializedJSON(storageManager: IStorageManager, serializedObject: string, persistenceLevel: PersistenceTypes = PersistenceTypes.heavy) {
        return new AuthenticatedUser(storageManager, JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date')) return value ? new Date(value) : undefined;
            else if (key === '') {
                value.lastSerializedString = serializedObject;
                value.lastSerializedTime = Date.now();
                value.lastSerializedPersistenceType = persistenceLevel;
            } else return value;
        }));
    }

    public onApiProcessed(successResponseData: any, clearOverlay = false) {
        Object.keys(successResponseData).forEach((key: string) => {
            if (key === 'token') this._token = successResponseData[key];
            else if (key === 'refreshToken') this._refreshToken = successResponseData[key];
            else if (key === 'tokenExpirationDate') this._tokenExpirationDate = new Date(successResponseData[key]);
            else if (key === 'refreshTokenExpirationDate') this._refreshTokenExpirationDate = new Date(successResponseData[key]);
            else if (key === 'profile') {
                const profile = successResponseData[key];
                this._profile.userId = profile.userId;
                this._profile.username = profile.username;
                this._profile.email = profile.email;
                this._profile.clientId = profile.clientId;
                this._profile.firstName = profile.firstName;
                this._profile.middleName = profile.middleName;
                this._profile.lastName = profile.lastName;
                this._profile.createdDate = new Date(profile.createdDate);
                this._profile.modifiedDate = new Date(profile.modifiedDate);
            }
        });
        if (clearOverlay) this._overlay = {};
        this._isPartial = false;
        this.writeAccessed(StorageRecordType.authentication, this._profile.clientId);
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
        // AuthenticatedUser is always heavy
        // check to see if we can re-use a cached result
        if (this.lastWriteAccessTime < this._lastSerializedTime && persistenceType === this._lastSerializedPersistenceType) {
            return this._lastSerializedString;
        }
        const serializedObject = JSON.stringify(Object.assign({
            token: this._token,
            refreshTokenExpirationDate: this._refreshToken,
            tokenExpirationDate: this._tokenExpirationDate.toISOString(),
            refreshTokenExpirationDate: this._refreshTokenExpirationDate.toISOString(),
            profile: JSON.stringify(this._profile, (key, value) => key.endsWith('Date') ? value.toISOString() : value),
        }, (this.isDirty() ? { overlay: this.stringifyOverlay() } : null)));
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
        return Object.assign({}, this._profile, this._overlay.profile);
    }

    public toUpdateDto(): any {
        return Object.assign({}, this._profile, this._overlay.profile);
    }

    public toReplayUser(): IReplayUser {
        return {
            token: this._overlay.token || this._token,
            refreshToken: this._overlay.refreshToken || this._refreshToken,
            userId: this._overlay.profile?.userId || this._profile.userId,
        };
    }
}
