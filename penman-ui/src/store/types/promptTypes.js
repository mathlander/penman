import { defaultDate } from '../../constants';
import { nullError } from './errorTypes';
import { persistenceTypes, storageRecordTypes } from './storageTypes';
import { generateUuid } from '../../utilities';
import { mergePlainText, mergeRichText } from '../algorithms/mergeManager';

export const nullPrompt = {
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

export const defaultPromptState = {
    uuidLookup: {},
    prompts: {},
    promptErrorState: nullError,
    pendingActions: [],
    offlineActionQueue: [],
    lastReadAllDate: defaultDate,
};

export const Prompt = (function() {
    const Prompt = function(storageManager, initialState) {
        let now = new Date();
        this.storageManager = storageManager;
        this.storageRecordType = storageRecordTypes.prompt;
        this.promptId = (initialState && initialState.promptId) || 0;
        this.userId = (initialState && initialState.userId) || 0;
        this.clientId = (initialState && initialState.clientId) || generateUuid();
        this.eventStartDate = new Date((initialState && initialState.eventStartDate) || now);
        this.eventEndDate = new Date((initialState && initialState.eventEndDate) || now);
        this.title = (initialState && initialState.title) || '';
        this.body = (initialState && initialState.body) || '';
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
        this.isPartial = (this.promptId > 0 && this.createdDate.getTime() === now.getTime());
    };
    Prompt.prototype.handleCollision = function() {
        this.clientId = generateUuid();
        this.clientIdHistory.push(this.clientId);
    };
    Prompt.prototype.readAccessed = function() {
        this.lastReadAccessTime = Date.now();
        this.storageManager.readAccessed(this.storageRecordType, this.clientId);
    };
    Prompt.prototype.writeAccessed = function() {
        this.lastWriteAccessTime = Date.now();
        this.storageManager.writeAccessed(this.storageRecordType, this.clientId);
    };
    Prompt.prototype.get = function(key) {
        this.readAccessed();
        return this.overlay[key] || this[key];
    };
    Prompt.prototype.set = function(key, value) {
        this.overlay[key] = value;
        this.writeAccessed();
    };
    Prompt.prototype.onApiProcessed = function(successResponseData, clearOverlay = false) {
        const instance = this;
        Object.keys(successResponseData).forEach((key) => {
            if (key === 'promptId') instance.promptId = successResponseData[key];
            else if (key === 'userId') instance.userId = successResponseData[key];
            else if (key === 'clientId') instance.clientId = successResponseData[key];
            else if (key === 'eventStartDate') instance.eventStartDate = new Date(successResponseData[key]);
            else if (key === 'eventEndDate') instance.eventEndDate = new Date(successResponseData[key]);
            else if (key === 'createdDate') instance.createdDate = new Date(successResponseData[key]);
            else if (key === 'modifiedDate') instance.modifiedDate = new Date(successResponseData[key]);
            else if (key === 'isDeleted') instance.isDeleted = successResponseData[key];
            else if (key === 'title') {
                if (instance.overlay.title) {
                    instance.overlay.title = mergePlainText(instance.title, instance.overlay.title, successResponseData[key]);
                }
                instance.title = successResponseData[key];
            }
            else if (key === 'body') {
                if (instance.overlay.body) {
                    instance.overlay.body = mergeRichText(instance.body, instance.overlay.body, successResponseData[key]);
                }
                instance.body = successResponseData[key];
            }
        });
        if (clearOverlay) this.overlay = {};
        this.isPartial = false;
        this.writeAccessed();
        this.storageManager.publish(this.storageRecordType, this.clientIdHistory, this);
        return this;
    };
    Prompt.prototype.computeWeight = function(persistenceType = persistenceTypes.heavy) {
        /**
         * substitutions:
         *      'promptId': "a"
         *      'userId': "0"
         *      'clientId': "3",
         *      'eventStartDate': "A",
         *      'eventEndDate': "B",
         *      'title': "C",
         *      'body': "D",
         *      'createdDate': "v",
         *      'modifiedDate': "w",
         *      'isDeleted': "x",
         *      'clientIdHistory': "y",
         *      'lastSerializedPersistenceType': "z",
         *      'overlay': "_",
         */
        if (this.lastWriteAccessTime < this.lastWeighedTimestamp) return this.weightsByPersistence[persistenceType];
        // initialize with default key weights (braces + quoted keys + commas)
        // {}, promptId: "a":${}, userId => "0":${}, clientId => "3":${}, lastSerializedPersistenceType => "z":
        let featherWeight = 2 + 4*4 + 3;
        // featherWeight + eventStartDate => "A":, eventEndDate => "B", title => "C":, body => "D":
        let lightWeight = featherWeight + 5*4 + 5;
        // lightWeight + createdDate => "v":, modifiedDate => "w":, isDeleted => "x":,
        let heavyWeight = lightWeight + 3*4 + 3;
        // account for promptId
        const promptIdLength = this.promptId.toString().length;
        featherWeight += promptIdLength;
        lightWeight += promptIdLength;
        heavyWeight += promptIdLength;
        // account for userId
        const userIdLength = this.userId.toString().length;
        featherWeight += userIdLength;
        lightWeight += userIdLength;
        heavyWeight += userIdLength;
        // account for clientId
        // ex: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        const clientIdLength = 36 + 2;
        featherWeight += clientIdLength;
        lightWeight += clientIdLength;
        heavyWeight += clientIdLength;
        // account for eventStartDate
        // ex: "2020-07-07T03:18:56.870Z"
        const eventStartDateLength = 24 + 2;
        lightWeight += eventStartDateLength;
        heavyWeight += eventStartDateLength;
        // account for eventEndDate
        const eventEndDateLength = 24 + 2;
        lightWeight += eventEndDateLength;
        heavyWeight += eventEndDateLength;
        // account for title
        const titleLength = this.title.length + 2;
        lightWeight += titleLength;
        heavyWeight += titleLength;
        // account for body
        const bodyLength = this.body.length + 2;
        lightWeight += bodyLength;
        heavyWeight += bodyLength;
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
            // "{"a":1000,"0":1000,...,"_":{...}}" =>
            //      lengthOf(  "_":{}  ) + (keys * 4) + (commas=keys-1)
            const overlayBaseCost = 6 + (overlayKeys.length*4) + (overlayKeys.length-1);
            featherWeight += overlayBaseCost;
            lightWeight += overlayBaseCost;
            heavyWeight += overlayBaseCost;
            if (this.overlay.promptId) {
                const promptIdOverlayLength = this.overlay.promptId.toString().length;
                featherWeight += promptIdOverlayLength;
                lightWeight += promptIdOverlayLength;
                heavyWeight += promptIdOverlayLength;
            }
            if (this.overlay.userId) {
                const userIdOverlayLength = this.overlay.userId.toString().length;
                featherWeight += userIdOverlayLength;
                lightWeight += userIdOverlayLength;
                heavyWeight += userIdOverlayLength;
            }
            if (this.overlay.clientId) {
                const clientIdOverlayLength = 36 + 2;
                featherWeight += clientIdOverlayLength;
                lightWeight += clientIdOverlayLength;
                heavyWeight += clientIdOverlayLength;
            }
            if (this.overlay.eventStartDate) {
                const eventStartDateOverlayLength = 24 + 2;
                featherWeight += eventStartDateLength + eventStartDateOverlayLength + 1;
                lightWeight += eventStartDateOverlayLength + 1;
                heavyWeight += eventStartDateOverlayLength;
            }
            if (this.overlay.eventEndDate) {
                const eventEndDateOverlayLength = 24 + 2;
                featherWeight += eventEndDateLength + eventEndDateOverlayLength + 1;
                lightWeight += eventEndDateOverlayLength + 1;
                heavyWeight += eventEndDateOverlayLength;
            }
            if (this.overlay.title) {
                const titleOverlayLength = this.overlay.title.length + 2;
                featherWeight += titleLength + titleOverlayLength + 1;
                lightWeight += titleOverlayLength;
                heavyWeight += titleOverlayLength;
            }
            if (this.overlay.body) {
                const bodyOverlayLength = this.overlay.body.length + 2;
                featherWeight += bodyLength + bodyOverlayLength + 1;
                lightWeight += bodyOverlayLength;
                heavyWeight += bodyOverlayLength;
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
    Prompt.prototype.serializeObject = function(persistenceType = persistenceTypes.heavy) {
        // check to see if we can re-use a cached result
        if (this.lastWriteAccessTime < this.lastSerializedTimestamp && persistenceType === this.lastSerializedPersistenceType) {
            return this.lastSerializedString;
        }
        /**
         * substitutions:
         *      'promptId': "a"
         *      'userId': "0"
         *      'clientId': "3",
         *      'eventStartDate': "A",
         *      'eventEndDate': "B",
         *      'title': "C",
         *      'body': "D",
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
            if (currentKey === 'promptId') previousValue['a'] = this.promptId;
            else if (currentKey === 'userId') previousValue['0'] = this.userId;
            else if (currentKey === 'clientId') previousValue['3'] = this.clientId;
            else if (currentKey === 'eventStartDate') previousValue['A'] = this.eventStartDate.toISOString();
            else if (currentKey === 'eventEndDate') previousValue['B'] = this.eventEndDate.toISOString();
            else if (currentKey === 'title') previousValue['C'] = this.title;
            else if (currentKey === 'body') previousValue['D'] = this.body;
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
                    a: this.promptId,
                    0: this.userId,
                    3: this.clientId,
                    z: persistenceTypes.feather,
                }, overlayedOrigins, (this.isDirty ? { _: overlayString } : null)));
                break;
            case persistenceTypes.light:
                serializedObject = JSON.stringify(Object.assign({
                    a: this.promptId,
                    0: this.userId,
                    3: this.clientId,
                    A: this.eventStartDate.toISOString(),
                    B: this.eventEndDate.toISOString(),
                    C: this.title,
                    D: this.body,
                    z: persistenceTypes.light,
                }, overlayedOrigins, (this.isDirty ? { _: overlayString } : null)));
                break;
            case persistenceTypes.heavy:
                serializedObject = JSON.stringify(Object.assign({
                    a: this.promptId,
                    0: this.userId,
                    3: this.clientId,
                    A: this.eventStartDate.toISOString(),
                    B: this.eventEndDate.toISOString(),
                    C: this.title,
                    D: this.body,
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
    Prompt.prototype.isDirty = function() {
        return Object.keys(this.overlay).length > 0;
    };
    Prompt.prototype.toCreateDto = function() {
        const dto = Object.assign({
            userId: this.userId,
            clientId: this.clientId,
            eventStartDate: this.eventStartDate,
            eventEndDate: this.eventEndDate,
            title: this.title,
            body: this.body,
        }, this.overlay);
        dto.eventStartDate = dto.eventStartDate.toISOString();
        dto.eventEndDate = dto.eventEndDate.toISOString();
        return dto;
    };
    Prompt.prototype.toUpdateDto = function() {
        const dto = Object.assign({
            promptId: this.promptId,
            userId: this.userId,
            clientId: this.clientId,
            eventStartDate: this.eventStartDate,
            eventEndDate: this.eventEndDate,
            title: this.title,
            body: this.body,
        }, this.overlay);
        dto.eventStartDate = dto.eventStartDate.toISOString();
        dto.eventEndDate = dto.eventEndDate.toISOString();
        return dto;
    };
    return Prompt;
})();

export const promptFromSerializedJSON = (storageManager, serializedObject) => {
    /**
     * substitutions:
     *      'promptId': "a"
     *      'userId': "0"
     *      'clientId': "3",
     *      'eventStartDate': "A",
     *      'eventEndDate': "B",
     *      'title': "C",
     *      'body': "D",
     *      'createdDate': "v",
     *      'modifiedDate': "w",
     *      'isDeleted': "x",
     *      'clientIdHistory': "y",
     *      'lastSerializedPersistenceType': "z",
     *      'overlay': "_",
     */
    let restoredObject = {};
    return new Prompt(storageManager, JSON.parse(serializedObject, (key, value) => {
        if (key === 'a') { restoredObject.promptId = value; return null; }
        else if (key === '0') { restoredObject.userId = value; return null; }
        else if (key === '3') { restoredObject.clientId = value; return null; }
        else if (key === 'A') { restoredObject.eventStartDate = new Date(value); return null; }
        else if (key === 'B') { restoredObject.eventEndDate = new Date(value); return null; }
        else if (key === 'C') { restoredObject.title = value; return null; }
        else if (key === 'D') { restoredObject.body = value; return null; }
        else if (key === 'v') { restoredObject.createdDate = new Date(value); return null; }
        else if (key === 'w') { restoredObject.modifiedDate = new Date(value); return null; }
        else if (key === 'x') { restoredObject.isDeleted = value; return null; }
        else if (key === 'y') { restoredObject.clientIdHistory = value; return null; }
        else if (key === 'z') { restoredObject.lastSerializedPersistenceType = value; return null; }
        else if (key === '_') { restoredObject.overlay = value; return null; }
        else if (key === '') return restoredObject;
    }));
};
