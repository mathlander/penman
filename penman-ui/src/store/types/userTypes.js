import { defaultDate } from '../../constants';
import { nullError } from './errorTypes';
import { persistenceTypes, storageRecordTypes } from './storageTypes';
import { generateUuid } from '../../utilities';

export const nullProfile = {
    userId: 0,
    username: '',
    email: '',
    clientId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    createdDate: defaultDate,
    modifiedDate: defaultDate,
    isDeleted: false,
};

export const defaultUserState = {
    uuidLookup: {},
    userProfiles: {},
    userErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAllDate: defaultDate,
};

export const UserProfile = (function() {
    const UserProfile = function(storageManager, initialState) {
        let now = new Date();
        this.storageManager = storageManager;
        this.storageRecordType = storageRecordTypes.user;
        this.userId = (initialState && initialState.userId) || 0;
        this.username = (initialState && initialState.username) || '';
        this.email = (initialState && initialState.email) || '';
        this.clientId = (initialState && initialState.clientId) || generateUuid();
        this.firstName = (initialState && initialState.firstName) || '';
        this.middleName = (initialState && initialState.middleName) || '';
        this.lastName = (initialState && initialState.lastName) || '';
        this.createdDate = new Date((initialState && initialState.createdDate) || now);
        this.modifiedDate = new Date((initialState && initialState.modifiedDate) || now);
        this.isDeleted = (initialState && initialState.isDeleted) || false;

        this.clientIdHistory = (initialState && initialState.clientIdHistory) || [this.clientId];
        this.overlay = (initialState && initialState.overlay) || {};

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

        // meta data is only present on full load
        this.isPartial = (this.userId > 0 && this.createdDate.getTime() === now.getTime());
    };
    UserProfile.prototype.handleCollision = function() {
        this.clientId = generateUuid();
        this.clientIdHistory.push(this.clientId);
    };
    UserProfile.prototype.readAccessed = function() {
        this.lastReadAccessTime = Date.now();
        this.storageManager.readAccessed(this.storageRecordType, this.clientId);
    };
    UserProfile.prototype.writeAccessed = function() {
        this.lastWriteAccessTime = Date.now();
        this.storageManager.writeAccessed(this.storageRecordType, this.clientId);
    };
    UserProfile.prototype.get = function(key) {
        this.readAccessed();
        return this.overlay[key] || this[key];
    };
    UserProfile.prototype.set = function(key, value) {
        this.overlay[key] = value;
        this.writeAccessed();
    };
    UserProfile.prototype.onApiProcessed = function(successResponseData, clearOverlay = false) {
        const instance = this;
        Object.keys(successResponseData).forEach((key) => {
            if (key === 'userId') instance.userId = successResponseData[key];
            else if (key === 'username') instance.username = successResponseData[key];
            else if (key === 'email') instance.email = successResponseData[key];
            else if (key === 'clientId') instance.clientId = successResponseData[key];
            else if (key === 'firstName') instance.firstName = successResponseData[key];
            else if (key === 'middleName') instance.middleName = successResponseData[key];
            else if (key === 'lastName') instance.lastName = successResponseData[key];
            else if (key === 'createdDate') instance.createdDate = new Date(successResponseData[key]);
            else if (key === 'modifiedDate') instance.modifiedDate = new Date(successResponseData[key]);
            else if (key === 'isDeleted') instance.isDeleted = successResponseData[key];
        });
        if (clearOverlay) this.overlay = {};
        this.isPartial = false;
        this.writeAccessed();
        this.storageManager.publish(this.storageRecordType, this.clientIdHistory, this);
        return this;
    };
    UserProfile.prototype.computeWeight = function(persistenceType = persistenceTypes.heavy) {
        /**
         * substitutions:
         *      'userId': "0"
         *      'username': "1"
         *      'email': "2",
         *      'clientId': "3",
         *      'firstName': "4",
         *      'middleName': "5",
         *      'lastName': "6",
         *      'createdDate': "v",
         *      'modifiedDate': "w",
         *      'isDeleted': "x",
         *      'clientIdHistory': "y",
         *      'lastSerializedPersistenceType': "z",
         *      'overlay': "_",
         */
        if (this.lastWriteAccessTime < this.lastWeighedTimestamp) return this.weightsByPersistence[persistenceType];
        // initialize with default key weights (braces + quoted keys + commas)
        // {}, userId => "0":${}, clientId => "3":${}, lastSerializedPersistenceType => "z":
        let featherWeight = 2 + 3*4 + 2;
        // featherWeight + username => "1":, email => "2", firstName => "4":, middleName => "5":, lastName => "6":
        let lightWeight = featherWeight + 5*4 + 5;
        // lightWeight + createdDate => "v":, modifiedDate => "w":, isDeleted => "x":,
        let heavyWeight = lightWeight + 3*4 + 3;
        // account for userId
        const userIdLength = this.userId.toString().length;
        featherWeight += userIdLength;
        lightWeight += userIdLength;
        heavyWeight += userIdLength;
        // account for username
        const usernameLength = this.username.length + 2;
        lightWeight += usernameLength;
        heavyWeight += usernameLength;
        // account for email
        const emailLength = this.email.length + 2;
        lightWeight += emailLength;
        heavyWeight += emailLength;
        // account for clientId
        // ex: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        const clientIdLength = 36 + 2;
        featherWeight += clientIdLength;
        lightWeight += clientIdLength;
        heavyWeight += clientIdLength;
        // account for firstName
        const firstNameLength = this.firstName.length + 2;
        lightWeight += firstNameLength;
        heavyWeight += firstNameLength;
        // account for middleName
        const middleNameLength = this.middleName.length + 2;
        lightWeight += middleNameLength;
        heavyWeight += middleNameLength;
        // account for lastName
        const lastNameLength = this.lastName.length + 2;
        lightWeight += lastNameLength;
        heavyWeight += lastNameLength;
        // account for createdDate
        // ex: "2020-07-07T03:18:56.870Z"
        const createdDateLength = 24 + 2;
        heavyWeight += createdDateLength;
        // account for modifiedDate
        const modifiedDateLength = 24 + 2;
        heavyWeight += modifiedDateLength;
        // account for isDeleted
        const isDeletedLength = this.isDeleted ? 4 : 5;
        heavyWeight += isDeletedLength;
        // account for clientIdHistory
        if (this.clientIdHistory.length > 1) {
            const clientIdHistoryLength = JSON.stringify(this.clientIdHistory).length + 1;
            featherWeight += clientIdHistoryLength;
            lightWeight += clientIdHistoryLength;
            heavyWeight += clientIdHistoryLength;
        }
        // account for lastSerializedPersistenceType
        const lastSerializedPersistenceTypeLength = 1;
        featherWeight += lastSerializedPersistenceTypeLength;
        lightWeight += lastSerializedPersistenceTypeLength;
        heavyWeight += lastSerializedPersistenceTypeLength;

        const overlayKeys = Object.keys(this.overlay);
        if (overlayKeys.length > 0) {
            // "{"0":1000,"1":"username",...,"_":{...}}" =>
            //      lengthOf(  "_":{}  ) + (keys * 4) + (commas=keys-1)
            const overlayBaseCost = 6 + (overlayKeys.length*4) + (overlayKeys.length-1);
            featherWeight += overlayBaseCost;
            lightWeight += overlayBaseCost;
            heavyWeight += overlayBaseCost;
            if (this.overlay.userId) {
                const userIdOverlayLength = this.overlay.userId.toString().length;
                featherWeight += userIdOverlayLength;
                lightWeight += userIdOverlayLength;
                heavyWeight += userIdOverlayLength;
            }
            if (this.overlay.username) {
                const usernameOverlayLength = this.overlay.username.length + 2;
                lightWeight += usernameOverlayLength;
                heavyWeight += usernameOverlayLength;
            }
            if (this.overlay.email) {
                const emailOverlayLength = this.overlay.email.length + 2;
                lightWeight += emailOverlayLength;
                heavyWeight += emailOverlayLength;
            }
            if (this.overlay.clientId) {
                const clientIdOverlayLength = 36 + 2;
                featherWeight += clientIdOverlayLength;
                lightWeight += clientIdOverlayLength;
                heavyWeight += clientIdOverlayLength;
            }
            if (this.overlay.firstName) {
                const firstNameOverlayLength = this.overlay.firstName.length + 2;
                featherWeight += firstNameLength + firstNameOverlayLength + 1;
                lightWeight += firstNameOverlayLength;
                heavyWeight += firstNameOverlayLength;
            }
            if (this.overlay.middleName) {
                const middleNameOverlayLength = this.overlay.middleName.length + 2;
                featherWeight += middleNameLength + middleNameOverlayLength + 1;
                lightWeight += middleNameOverlayLength;
                heavyWeight += middleNameOverlayLength;
            }
            if (this.overlay.lastName) {
                const lastNameOverlayLength = this.overlay.lastName.length + 2;
                featherWeight += lastNameLength + lastNameOverlayLength + 1;
                lightWeight += lastNameOverlayLength;
                heavyWeight += lastNameOverlayLength;
            }
            if (this.overlay.createdDate) {
                const createdDateOverlayLength = 24 + 2;
                featherWeight += createdDateLength + createdDateOverlayLength + 1;
                lightWeight += createdDateLength + createdDateOverlayLength + 1;
                heavyWeight += createdDateOverlayLength;
            }
            if (this.overlay.modifiedDate) {
                const modifiedDateOverlayLength = 24 + 2;
                featherWeight += modifiedDateLength + modifiedDateOverlayLength + 1;
                lightWeight += modifiedDateLength + modifiedDateOverlayLength + 1;
                heavyWeight += modifiedDateOverlayLength;
            }
            if (this.overlay.isDeleted) {
                const isDeletedOverlayLength = this.overlay.isDeleted ? 4 : 5;
                featherWeight += isDeletedLength + isDeletedOverlayLength + 1;
                lightWeight += isDeletedLength + isDeletedOverlayLength + 1;
                heavyWeight += isDeletedOverlayLength;
            }
        }

        this.weightsByPersistence[persistenceTypes.feather] = featherWeight;
        this.weightsByPersistence[persistenceTypes.light] = lightWeight;
        this.weightsByPersistence[persistenceTypes.heavy] = heavyWeight;
        this.lastWeighedTimestamp = Date.now();
        return this.weightsByPersistence[persistenceType];
    };
    UserProfile.prototype.serializeObject = function(persistenceType = persistenceTypes.heavy) {
        // check to see if we can re-use a cached result
        if (this.lastWriteAccessTime < this.lastSerializedTimestamp && persistenceType === this.lastSerializedPersistenceType) {
            return this.lastSerializedString;
        }
        /**
         * substitutions:
         *      'userId': "0"
         *      'username': "1"
         *      'email': "2",
         *      'clientId': "3",
         *      'firstName': "4",
         *      'middleName': "5",
         *      'lastName': "6",
         *      'createdDate': "v",
         *      'modifiedDate': "w",
         *      'isDeleted': "x",
         *      'clientIdHistory': "y",
         *      'lastSerializedPersistenceType': "z",
         *      'overlay': "_",
         */
        // otherwise...
        let serializedObject = '';
        let overlayedOrigins = Object.keys(this.overlay).reduce((previousValue, currentKey) => {
            if (currentKey === 'userId') previousValue['0'] = this.userId;
            else if (currentKey === 'username') previousValue['1'] = this.username;
            else if (currentKey === 'email') previousValue['2'] = this.email;
            else if (currentKey === 'clientId') previousValue['3'] = this.clientId;
            else if (currentKey === 'firstName') previousValue['4'] = this.firstName;
            else if (currentKey === 'middleName') previousValue['5'] = this.middleName;
            else if (currentKey === 'lastName') previousValue['6'] = this.lastName;
            else if (currentKey === 'createdDate') previousValue['v'] = this.createdDate.toISOString();
            else if (currentKey === 'modifiedDate') previousValue['w'] = this.modifiedDate.toISOString();
            else if (currentKey === 'isDeleted') previousValue['x'] = this.isDeleted;
            return previousValue;
        }, {});
        if (this.clientIdHistory.length > 1) overlayedOrigins['y'] = this.clientIdHistory;
        let overlayString = JSON.stringify(Object.keys(this.overlay).reduce((previousValue, currentKey) => {
            if (currentKey === 'userId') previousValue['0'] = this.overlay.userId;
            else if (currentKey === 'username') previousValue['1'] = this.overlay.username;
            else if (currentKey === 'email') previousValue['2'] = this.overlay.email;
            else if (currentKey === 'clientId') previousValue['3'] = this.overlay.clientId;
            else if (currentKey === 'firstName') previousValue['4'] = this.overlay.firstName;
            else if (currentKey === 'middleName') previousValue['5'] = this.overlay.middleName;
            else if (currentKey === 'lastName') previousValue['6'] = this.overlay.lastName;
            else if (currentKey === 'createdDate') previousValue['v'] = this.overlay.createdDate.toISOString();
            else if (currentKey === 'modifiedDate') previousValue['w'] = this.overlay.modifiedDate.toISOString();
            else if (currentKey === 'isDeleted') previousValue['x'] = this.overlay.isDeleted;
            return previousValue;
        }, {}));
        switch (persistenceType) {
            case persistenceTypes.feather:
                serializedObject = JSON.stringify(Object.assign({
                    0: this.userId,
                    3: this.clientId,
                    z: persistenceTypes.feather,
                }, overlayedOrigins, (this.isDirty ? { _: overlayString } : null)));
                break;
            case persistenceTypes.light:
                serializedObject = JSON.stringify(Object.assign({
                    0: this.userId,
                    1: this.username,
                    2: this.email,
                    3: this.clientId,
                    4: this.firstName,
                    5: this.middleName,
                    6: this.lastName,
                    z: persistenceTypes.light,
                }, overlayedOrigins, (this.isDirty ? { _: overlayString } : null)));
                break;
            case persistenceTypes.heavy:
                serializedObject = JSON.stringify(Object.assign({
                    0: this.userId,
                    1: this.username,
                    2: this.email,
                    3: this.clientId,
                    4: this.firstName,
                    5: this.middleName,
                    6: this.lastName,
                    v: this.createdDate.toISOString(),
                    w: this.modifiedDate.toISOString(),
                    x: this.isDeleted,
                    z: persistenceTypes.heavy,
                }, overlayedOrigins, (this.isDirty ? { _: overlayString } : null)));
                break;
            default:
                break;
        }
        this.lastSerializedTimestamp = Date.now();
        this.lastSerializedString = serializedObject;
        this.lastSerializedPersistenceType = persistenceType;
        return serializedObject;
    };
    UserProfile.prototype.isDirty = function() {
        return Object.keys(this.overlay).length > 0;
    };
    UserProfile.prototype.toCreateDto = function() {
        return Object.assign({
            username: this.username,
            email: this.email,
            password: 'must-be-replaced',
            clientId: this.clientId,
            firstName: this.firstName,
            middleName: this.middleName,
            lastName: this.lastName,
        }, this.overlay);
    };
    UserProfile.prototype.toUpdateDto = function() {
        return Object.assign({
            userId: this.userId,
            username: this.username,
            email: this.email,
            clientId: this.clientId,
            firstName: this.firstName,
            middleName: this.middleName,
            lastName: this.lastName,
        }, this.overlay);
    };
    return UserProfile;
})();

export const userProfileFromSerializedJSON = (storageManager, serializedObject) => {
    /**
     * substitutions:
     *      'userId': "0"
     *      'username': "1"
     *      'email': "2",
     *      'clientId': "3",
     *      'firstName': "4",
     *      'middleName': "5",
     *      'lastName': "6",
     *      'createdDate': "v",
     *      'modifiedDate': "w",
     *      'isDeleted': "x",
     *      'clientIdHistory': "y",
     *      'lastSerializedPersistenceType': "z",
     *      'overlay': "_",
     */
    let restoredObject = {};
    return new UserProfile(storageManager, JSON.parse(serializedObject, (key, value) => {
        if (key === '0') { restoredObject.userId = value; return null; }
        else if (key === '1') { restoredObject.username = value; return null; }
        else if (key === '2') { restoredObject.email = value; return null; }
        else if (key === '3') { restoredObject.clientId = value; return null; }
        else if (key === '4') { restoredObject.firstName = value; return null; }
        else if (key === '5') { restoredObject.middleName = value; return null; }
        else if (key === '6') { restoredObject.lastName = value; return null; }
        else if (key === 'v') { restoredObject.createdDate = new Date(value); return null; }
        else if (key === 'w') { restoredObject.modifiedDate = new Date(value); return null; }
        else if (key === 'x') { restoredObject.isDeleted = value; return null; }
        else if (key === 'y') { restoredObject.clientIdHistory = value; return null; }
        else if (key === 'z') { restoredObject.lastSerializedPersistenceType = value; return null; }
        else if (key === '_') { restoredObject.overlay = value; return null; }
        else if (key === '') return restoredObject;
    }));
};
