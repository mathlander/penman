import { defaultDate } from '../../constants';
import { nullError } from './errorTypes';
import { persistenceTypes, storageRecordTypes } from './storageTypes';
import { UserProfile, nullProfile, userProfileFromSerializedJSON } from './userTypes';

export const nullUser = {
    token: '',
    refreshToken: '',
    tokenExpirationDate: defaultDate,
    refreshTokenExpirationDate: defaultDate,
    profile: nullProfile,
};

export const defaultAuthenticationState = {
    authenticatedUser: nullUser,
    authErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
};

export const AuthenticatedUser = (function() {
    const AuthenticatedUser = function(storageManager, initialState) {
        let now = new Date();
        this.storageManager = storageManager;
        this.storageRecordType = storageRecordTypes.authentication;
        this.token = (initialState && initialState.token) || '';
        this.refreshToken = (initialState && initialState.refreshToken) || '';
        this.tokenExpirationDate = new Date((initialState && initialState.tokenExpirationDate) || now);
        this.refreshTokenExpirationDate = new Date((initialState && initialState.refreshTokenExpirationDate) || now);
        this.profile = new UserProfile(storageManager, (initialState && initialState.profile) || {});

        this.overlay = (initialState && initialState.overlay) || {};

        // readonly copies for the storage manager
        this.userId = this.profile.userId;
        this.clientId = this.profile.clientId;
        this.createdDate = this.profile.createdDate;
        this.modifiedDate = this.profile.modifiedDate;

        this.lastReadAccessTime = 0;
        this.lastWriteAccessTime = 0;
        this.weightsByPersistence = {
            [persistenceTypes.forget]: 0,
            [persistenceTypes.feather]: -1,
            [persistenceTypes.light]: -1,
            [persistenceTypes.heavy]: -1,
        };
        this.lastWeighedTimestamp = (initialState && initialState.lastWeighedTimestamp) || -1;
        this.lastSerializedString = (initialState && initialState.lastSerializedString) || '';
        this.lastSerializedTimestamp = (initialState && initialState.lastSerializedTimestamp) || -1;
        this.lastSerializedPersistenceType = (initialState && initialState.lastSerializedPersistenceType) || persistenceTypes.forget;
        if (this.lastSerializedPersistenceType) this.weightsByPersistence[this.lastSerializedPersistenceType] = this.lastSerializedString.length;

        // this type is never partial
        this.isPartial = false;
    };
    AuthenticatedUser.prototype.handleCollision = function() {
        this.profile.handleCollision();
        this.clientId = this.profile.clientId;
    };
    AuthenticatedUser.prototype.readAccessed = function() {
        this.lastReadAccessTime = Date.now();
        this.storageManager.readAccessed(this.storageRecordType, this.clientId);
    };
    AuthenticatedUser.prototype.writeAccessed = function() {
        this.lastWriteAccessTime = Date.now();
        this.storageManager.writeAccessed(this.storageRecordType, this.clientId);
    };
    AuthenticatedUser.prototype.get = function(key) {
        this.readAccessed();
        return this.overlay[key] || this[key];
    };
    AuthenticatedUser.prototype.set = function(key, value) {
        this.overlay[key] = value;
        this.writeAccessed();
    };
    AuthenticatedUser.prototype.onApiProcessed = function(successResponseData, clearOverlay = false) {
        const instance = this;
        Object.keys(successResponseData).forEach((key) => {
            if (key === 'token') instance.token = successResponseData[key];
            else if (key === 'refreshToken') instance.refreshToken = successResponseData[key];
            else if (key === 'tokenExpirationDate') instance.tokenExpirationDate = new Date(successResponseData[key]);
            else if (key === 'refreshTokenExpirationDate') instance.refreshTokenExpirationDate = new Date(successResponseData[key]);
            else if (key === 'profile') instance.profile.onApiProcessed(successResponseData[key], clearOverlay);
        });
        // readonly copies for the storage manager
        this.userId = this.profile.userId;
        this.clientId = this.profile.clientId;
        this.createdDate = this.profile.createdDate;
        this.modifiedDate = this.profile.modifiedDate;
        if (clearOverlay) this.overlay = {};
        this.isPartial = false;
        this.writeAccessed();
        this.storageManager.publish(this.storageRecordType, this.profile.clientIdHistory, this);
        return this;
    };
    AuthenticatedUser.prototype.computeWeight = function(persistenceType = persistenceTypes.heavy) {
        /**
         * substitutions:
         *      'token': "T",
         *      'refreshToken': "R",
         *      'tokenExpirationDate': "<",
         *      'refreshTokenExpirationDate': ">",
         *      'profile': "P",
         *      'lastSerializedPersistenceType': "z",
         *      'overlay': "_",
         */
        if (this.lastWriteAccessTime < this.lastWeighedTimestamp) return this.weightsByPersistence[persistenceType];
        // there is usually no more than a single AuthenticatedUser instance managed at once
        // so the cost of serialization is cheap, hence it is always heavy
        const serializedObject = this.serialize(persistenceTypes.heavy);
        let featherWeight = serializedObject.length;
        let lightWeight = serializedObject.length;
        let heavyWeight = serializedObject.length;

        this.weightsByPersistence[persistenceTypes.feather] = featherWeight;
        this.weightsByPersistence[persistenceTypes.light] = lightWeight;
        this.weightsByPersistence[persistenceTypes.heavy] = heavyWeight;
        this.lastWeighedTimestamp = Date.now();
        return this.weightsByPersistence[persistenceType];
    };
    AuthenticatedUser.prototype.serializeObject = function(persistenceType = persistenceTypes.heavy) {
        // check to see if we can re-use a cached result... this type is always heavy
        // if (this.lastWriteAccessTime < this.lastSerializedTimestamp && persistenceType === this.lastSerializedPersistenceType) {
        if (this.lastWriteAccessTime < this.lastSerializedTimestamp) {
            return this.lastSerializedString;
        }
        /**
         * substitutions:
         *      'token': "T",
         *      'refreshToken': "R",
         *      'tokenExpirationDate': "<",
         *      'refreshTokenExpirationDate': ">",
         *      'profile': "P",
         *      'lastSerializedPersistenceType': "z",
         *      'overlay': "_",
         */
        // otherwise...
        let serializedObject = '';
        let overlayedOrigins = Object.keys(this.overlay).reduce((previousValue, currentKey) => {
            if (currentKey === 'token') previousValue['T'] = this.token;
            else if (currentKey === 'refreshToken') previousValue['R'] = this.refreshToken;
            else if (currentKey === 'tokenExpirationDate') previousValue['<'] = this.tokenExpirationDate.toISOString();
            else if (currentKey === 'refreshTokenExpirationDate') previousValue['>'] = this.refreshTokenExpirationDate.toISOString();
            else if (currentKey === 'profile') previousValue['P'] = this.profile.serialize(persistenceTypes.heavy);
            return previousValue;
        }, {});
        if (this.clientIdHistory.length > 1) overlayedOrigins['y'] = this.clientIdHistory;
        let overlayString = JSON.stringify(Object.keys(this.overlay).reduce((previousValue, currentKey) => {
            if (currentKey === 'token') previousValue['T'] = this.overlay.token;
            else if (currentKey === 'refreshToken') previousValue['R'] = this.overlay.refreshToken;
            else if (currentKey === 'tokenExpirationDate') previousValue['<'] = this.overlay.tokenExpirationDate.toISOString();
            else if (currentKey === 'refreshTokenExpirationDate') previousValue['>'] = this.overlay.refreshTokenExpirationDate.toISOString();
            else if (currentKey === 'profile') previousValue['P'] = this.overlay.profile.serialize(persistenceTypes.heavy);
            return previousValue;
        }, {}));
        serializedObject = JSON.stringify(Object.assign({
            "T": this.token,
            "R": this.refreshToken,
            "<": this.tokenExpirationDate,
            ">": this.refreshTokenExpirationDate,
            "P": this.profile.serialize(persistenceTypes.heavy),
            "z": persistenceTypes.heavy,
        }, overlayedOrigins, (this.isDirty ? { _: overlayString } : null)));
        this.lastSerializedTimestamp = Date.now();
        this.lastSerializedString = serializedObject;
        this.lastSerializedPersistenceType = persistenceTypes.heavy;
        return serializedObject;
    };
    AuthenticatedUser.prototype.isDirty = function() {
        return Object.keys(this.overlay).length > 0 || this.profile.isDirty();
    };
    AuthenticatedUser.prototype.toCreateDto = function() {
        return (this.overlay.profile && this.overlay.profile.toCreateDto()) || this.profile.toCreateDto();
    };
    AuthenticatedUser.prototype.toUpdateDto = function() {
        return (this.overlay.profile && this.overlay.profile.toUpdateDto()) || this.profile.toUpdateDto();
    };
    AuthenticatedUser.prototype.toReplayUser = function() {
        return {
            token: this.overlay.token || this.token,
            refreshToken: this.overlay.refreshToken || this.refreshToken,
            userId: this.userId,
        };
    };
    return AuthenticatedUser;
})();

export const authenticatedUserFromSerializedJSON = (storageManager, serializedObject) => {
    /**
     * substitutions:
     *      'token': "T",
     *      'refreshToken': "R",
     *      'tokenExpirationDate': "<",
     *      'refreshTokenExpirationDate': ">",
     *      'profile': "P",
     *      'lastSerializedPersistenceType': "z",
     *      'overlay': "_",
     */
    let restoredObject = {};
    return new AuthenticatedUser(storageManager, JSON.parse(serializedObject, (key, value) => {
        if (key === 'T') { restoredObject.token = value; return null; }
        else if (key === 'R') { restoredObject.refreshToken = value; return null; }
        else if (key === '<') { restoredObject.tokenExpirationDate = new Date(value); return null; }
        else if (key === '>') { restoredObject.refreshTokenExpirationDate = new Date(value); return null; }
        else if (key === 'P') { restoredObject.profile = userProfileFromSerializedJSON(storageManager, value); return null; }
        else if (key === 'z') { restoredObject.lastSerializedPersistenceType = value; return null; }
        else if (key === '_') { restoredObject.overlay = value; return null; }
        else if (key === '') return restoredObject;
    }));
};
