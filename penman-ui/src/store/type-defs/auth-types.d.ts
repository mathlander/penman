import { defaultDate } from '../../constants';
import { IReplayableAction } from './offline-types';
import { IError, nullError } from './error-types';
import { PrioritizableStorageItem, PersistenceTypes } from './storage-types';

export interface IAuthDto {
    username: string;
    password: string;
};

export interface ICreateUserDto {
    username: string;
    email: string;
    password: string;
    firstName: string;
    middleName: string;
    lastName: string;
};

export interface IDeleteUserDto {
    userId: number;
};

export interface IRefreshDto {
    refreshToken: string;
};

export interface IUpdatePasswordDto {
    userId: number;
    password: string;
};

export interface IUpdateProfileDto {
    userId: number;
    username: string;
    email: string;
    firstName: string;
    middleName: string;
    lastName: string;
};

export interface IUserProfile {
    userId: number;
    username: string;
    email: string;
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
    firstName?: string;
    middleName?: string;
    lastName?: string;
    createdDate?: Date;
    modifiedDate?: Date;
};

export interface IAuthenticatedUser extends IUserProfile {
    token: string;
    refreshToken: string;
    tokenExpirationDate: Date;
    refreshTokenExpirationDate: Date;
};

export interface IAuthenticatedUserShadow extends IUserProfileShadow {
    token?: string;
    refreshToken?: string;
    tokenExpirationDate?: Date;
    refreshTokenExpirationDate?: Date;
};

export interface IAuthenticationAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload?: IAuthDto | ICreateUserDto | IDeletedUserDto | IRefreshDto | IUpdatePasswordDto | IUpdateProfileDto | IUserProfile | IAuthenticatedUser;
    error?: IError;
    memento?: IReplayableAction;
};

export interface IAuthenticationState {
    authenticatedUser: AuthenticatedUser;
    authErrorState: IError;
    pendingActions: IAuthenticationAction[];
    offlineActionQueue: IReplayableAction[];
};

export const nullUser: AuthenticatedUser = new AuthenticatedUser({
    token: '',
    refreshToken: '',
    tokenExpirationDate: defaultDate,
    refreshTokenExpirationDate: defaultDate,

    userId: 0,
    username: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    createdDate: defaultDate,
    modifiedDate: defaultDate,
});

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

    private _userId: number;
    private _username: string;
    private _email: string;
    private _firstName: string;
    private _middleName: string;
    private _lastName: string;
    private _createdDate: Date;
    private _modifiedDate: Date;

    private _overlay: IAuthenticatedUserShadow;

    get token(): string { this.readAccessed(); return this._overlay.token || this._token; }
    set token(value: string) { this.writeAccessed(); this._overlay.token = value; }
    get refreshToken(): string { this.readAccessed(); return this._overlay.refreshToken || this._token; }
    set refreshToken(value: string) { this.writeAccessed(); this._overlay.refreshToken = value; }
    get tokenExpirationDate(): Date { this.readAccessed(); return this._overlay.tokenExpirationDate || this._tokenExpirationDate; }
    set tokenExpirationDate(value: Date) { this.writeAccessed(); this._overlay.tokenExpirationDate = value; }
    get refreshTokenExpirationDate(): Date { this.readAccessed(); return this._overlay.refreshTokenExpirationDate || this._refreshTokenExpirationDate; }
    set refreshTokenExpirationDate(value: Date) { this.writeAccessed(); this._overlay.refreshTokenExpirationDate = value; }

    get userId(): number { this.readAccessed(); return this._overlay.userId || this._userId; }
    set userId(value: number) { this.writeAccessed(); this._overlay.userId = value; }
    get username(): string { this.readAccessed(); return this._overlay.username || this._username; }
    set username(value: string) { this.writeAccessed(); this._overlay.username = value; }
    get email(): string { this.readAccessed(); return this._overlay.email || this._email; }
    set email(value: string) { this.writeAccessed(); this._overlay.email = value; }
    get firstName(): string { this.readAccessed(); return this._overlay.firstName || this._firstName; }
    set firstName(value: string) { this.writeAccessed(); this._overlay.firstName = value; }
    get middleName(): string { this.readAccessed(); return this._overlay.middleName || this._middleName; }
    set middleName(value: string) { this.writeAccessed(); this._overlay.middleName = value; }
    get lastName(): string { this.readAccessed(); return this._overlay.lastName || this._lastName; }
    set lastName(value: string) { this.writeAccessed(); this._overlay.lastName = value; }
    get createdDate(): Date { this.readAccessed(); return this._overlay.createdDate || this._createdDate; }
    set createdDate(value: Date) { this.writeAccessed(); this._overlay.createdDate = value; }
    get modifiedDate() { this.readAccessed(); return this._overlay.modifiedDate || this._modifiedDate; }
    set modifiedDate(value: Date) { this.writeAccessed(); this._overlay.modifiedDate = value; }

    constructor();
    constructor(user: IAuthenticatedUser);
    constructor(user?: any) {
        super();
        let now = new Date();
        this._token = user && user.userId || '';
        this._refreshToken = user && user.refreshToken || '';
        this._tokenExpirationDate = new Date(user && user.tokenExpirationDate || now);
        this._refreshTokenExpirationDate = new Date(user && user.refreshTokenExpirationDate || now);

        this._userId = user && user.userId || 0;
        this._username = user && user.username || '';
        this._email = user && user.email || '';
        this._firstName = user && user.firstName || '';
        this._middleName = user && user.middleName || '';
        this._lastName = user && user.lastName || '';
        this._createdDate = new Date(user && user.createdDate || now);
        this._modifiedDate = new Date(user && user.modifiedDate || now);

        this._overlay = user && user.overlay || {};

        this._isPartial = false;
    }

    static fromSerializedJSON(serializedObject: string) {
        return new AuthenticatedUser(JSON.parse(serializedObject, (key: string, value: any) => {
            if (key.endsWith('Date') || key === 'eventStart' || key === 'eventEnd') return value ? new Date(value) : undefined;
            else return value;
        }));
    }

    public onApiProcessed(successResponse: IUserProfile | IAuthenticatedUser, clearOverlay = false) {
        this.writeAccessed();
        Object.keys(successResponse).forEach((key: string) => {
            if (key === 'token') this._token = successResponse[key];
            else if (key === 'refreshToken') this._refreshToken = successResponse[key];
            else if (key === 'tokenExpirationDate') this._tokenExpirationDate = successResponse[key];
            else if (key === 'refreshTokenExpirationDate') this._refreshTokenExpirationDate = successResponse[key];

            else if (key === 'userId') this._userId = successResponse[key];
            else if (key === 'username') this._username = successResponse[key];
            else if (key === 'email') this._email = successResponse[key];
            else if (key === 'firstName') this._firstName = successResponse[key];
            else if (key === 'middleName') this._middleName = successResponse[key];
            else if (key === 'lastName') this._lastName = successResponse[key];
            else if (key === 'createdDate') this._createdDate = successResponse[key];
            else if (key === 'modifiedDate') this._modifiedDate = successResponse[key];
        });
        if (clearOverlay) this._overlay = {};
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
            token: this._token,
            refreshToken: this._refreshToken,
            tokenExpirationDate: this._tokenExpirationDate.toISOString(),
            refreshTokenExpirationDate: this._refreshTokenExpirationDate.toISOString(),
            userId: this._userId,
            username: this._username,
            email: this._email,
            firstName: this._firstName,
            middleName: this._middleName,
            lastName: this._lastName,
            createdDate: this._createdDate.toISOString(),
            modifiedDate: this._modifiedDate.toISOString(),
        }, (this.isDirty() ? { overlay: this.stringifyOverlay() } : null)));
    }

    // AuthenticatedUser is always heavy
    public computeWeight(persistenceType: PersistenceTypes = PersistenceTypes.heavy) { return this.toSerializedJSON().length; }
    public serialize(persistenceType: PersistenceTypes = PersistenceTypes.heavy) { return this.toSerializedJSON(); }
    public restore(serializedData: string) { return AuthenticatedUser.fromSerializedJSON(serializedData); }
    public isDirty() { return Object.keys(this._overlay).length > 0; }

    public toCreateDto(): any | ICreateUserDto {
        return {
            username: this._username,
            email: this._email,
            password: 'must-be-replaced',
            firstName: this._firstName,
            middleName: this._middleName,
            lastName: this._lastName
        };
    }

    public toUpdateDto(): any | IUpdateUserDto {
        return {
            userId: this._overlay.userId || this._userId,
            username: this._overlay.username || this._username,
            email: this._overlay.email || this._email,
            firstName: this._overlay.firstName || this._firstName,
            middleName: this._overlay.middleName || this._middleName,
            lastName: this._overlay.lastName || this._lastName,
        };
    }
}
