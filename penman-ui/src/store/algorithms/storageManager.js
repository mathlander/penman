import { storageRecordTypes, persistenceTypes } from '../types/storageTypes';
import { inflateBase64ToText, deflateTextToBase64 } from '../../utilities';
import { authConstants, promptConstants } from '../../constants';
import { defaultAuthenticationState, nullUser, AuthenticatedUser, authenticatedUserFromSerializedJSON } from '../types/authTypes';
// import { defaultUserState, nullProfile, UserProfile } from '../types/userTypes';
import { defaultPromptState, promptFromSerializedJSON } from '../types/promptTypes';
import { nullError } from '../types/errorTypes';
import { AuthActionMemento } from '../actions/authActions';
import { PromptActionMemento } from '../actions/promptActions';

export const PenmanStorageHeap = (function () {
    const PenmanStorageHeap = function(heap) {
        this.heap = heap || [];
    };
    PenmanStorageHeap.prototype.clone = function() {
        return new PenmanStorageHeap(this.heap.slice());
    };
    PenmanStorageHeap.prototype.compare = function(left, right) {
        // max heap
        return (right.item.lastWriteAccessTime - left.item.lastWriteAccessTime);
    };
    PenmanStorageHeap.prototype.peek = function() {
        return this.heap[0] || null;
    };
    PenmanStorageHeap.prototype.siftUp = function(storageRecord) {
        // heapId values are 1-indexed
        if (storageRecord.heapIndex() < 0 || storageRecord.heapNodeId > this.heap.length) throw new Error(`Storage record index was out bounds for the heap.`);
        while (storageRecord.heapIndex()) {
            let parentNodeId = storageRecord.heapNodeId >> 1;
            let parentNodeRecord = this.heap[parentNodeId - 1];
            if (this.compare(storageRecord, parentNodeRecord) < 0) {
                // swap
                this.heap[parentNodeRecord.heapIndex()] = storageRecord;
                this.heap[storageRecord.heapIndex()] = parentNodeRecord;
                let floatingItemNodeId = parentNodeId;
                parentNodeRecord.heapNodeId = storageRecord.heapNodeId;
                storageRecord.heapNodeId = floatingItemNodeId;
            } else break;
        }
    };
    PenmanStorageHeap.prototype.siftDown = function(storageRecord) {
        // heapId values are 1-indexed
        if (storageRecord.heapIndex() < 0 || storageRecord.heapNodeId > this.heap.length) throw new Error(`Storage record index was out bounds for the heap.`);
        while (storageRecord.heapNodeId < this.heap.length) {
            // check the children
            const leftChildNodeId = storageRecord.heapNodeId << 1;
            const rightChildNodeId = (storageRecord.heapNodeId << 1) + 1;
            // if there are no children, then the heap property has been restored
            if (leftChildNodeId > this.heap.length) break;
            const leftChildRecord = this.heap[leftChildNodeId - 1];
            if (rightChildNodeId > this.heap.length) {
                // only compare the left child
                if (this.compare(leftChildRecord, storageRecord) < 0) {
                    // swap
                    this.heap[leftChildRecord.heapIndex()] = storageRecord;
                    this.heap[storageRecord.heapIndex] = leftChildRecord;
                    const floatingItemNodeId = leftChildRecord.heapNodeId;
                    leftChildRecord.heapNodeId = storageRecord.heapNodeId;
                    storageRecord.heapNodeId = floatingItemNodeId;
                } else break;
            } else {
                const rightChildRecord = this.heap[rightChildNodeId - 1];
                const useLeftChild = this.compare(leftChildRecord, rightChildRecord) <= 0;
                if (useLeftChild && this.compare(leftChildRecord, storageRecord) < 0) {
                    // swap
                    this.heap[leftChildRecord.heapIndex()] = storageRecord;
                    this.heap[storageRecord.heapIndex()] = leftChildRecord;
                    const floatingItemNodeId = leftChildNodeId;
                    leftChildRecord.heapNodeId = storageRecord.heapNodeId;
                    storageRecord.heapNodeId = floatingItemNodeId;
                } else if (!useLeftChild && this.compare(rightChildRecord, storageRecord) < 0) {
                    // swap
                    this.heap[rightChildRecord.heapIndex()] = storageRecord;
                    this.heap[storageRecord.heapIndex()] = rightChildRecord;
                    const floatingItemNodeId = rightChildNodeId;
                    rightChildRecord.heapNodeId = storageRecord.heapNodeId;
                    storageRecord.heapNodeId = floatingItemNodeId;
                } else break;
            }
        }
    };
    PenmanStorageHeap.prototype.remove = function(storageRecord) {
        if (storageRecord.heapIndex() < 0 || storageRecord.heapNodeId > this.heap.length) return;
        else if (storageRecord.heapNodeId === this.heap.length) {
            this.heap.pop();
            return;
        }
        // swap with the lowest ranking item, then check to see if we need to sift up or down
        const floatingItem = this.heap.pop();
        this.heap[storageRecord.heapIndex()] = floatingItem;
        floatingItem.heapNodeId = storageRecord.heapNodeId;
        const parentNodeId = storageRecord.heapNodeId >> 1;
        const parentNodeRecord = this.heap[parentNodeId - 1];
        if (this.compare(floatingItem, parentNodeRecord) < 0) this.siftUp(floatingItem);
        else this.siftDown(floatingItem);
    };
    PenmanStorageHeap.prototype.insert = function(storageRecord) {
        // heapId is 1-indexed
        // heapIndex() is 0-indexed
        this.heap.push(storageRecord);
        let newItemHeapNodeId = this.heap.length;
        storageRecord.heapNodeId = newItemHeapNodeId;
        this.siftUp(storageRecord);
    };
    PenmanStorageHeap.prototype.extract = function() {
        if (this.heap.length === 0) return null;
        let floatingItem = this.heap.pop();
        if (this.heap.length === 0 && floatingItem) return floatingItem || null;
        else if (!floatingItem) return null;
        let maxItem = this.heap[0];
        let floatingItemNodeId = 1;
        this.heap[0] = floatingItem;
        floatingItem.heapNodeId = floatingItemNodeId;
        this.siftDown(floatingItem);
        return maxItem;
    };
    return PenmanStorageHeap;
})();

export const StorageManager = (function() {
    const StorageManager = function() {
        this.storageHeaps = {
            [storageRecordTypes.authentication]: new PenmanStorageHeap(),
            [storageRecordTypes.user]: new PenmanStorageHeap(),
            [storageRecordTypes.prompt]: new PenmanStorageHeap(),
        };
        this.lastReadRecords = {
            [storageRecordTypes.authentication]: null,
            [storageRecordTypes.user]: null,
            [storageRecordTypes.prompt]: null,
        };
        this.subscriptions = {
            [storageRecordTypes.authentication]: {},
            [storageRecordTypes.user]: {},
            [storageRecordTypes.prompt]: {},
        };
        this.lookup = {};
    };
    StorageManager.prototype.clear = function() {
        this.storageHeaps = {
            [storageRecordTypes.authentication]: new PenmanStorageHeap(),
            [storageRecordTypes.user]: new PenmanStorageHeap(),
            [storageRecordTypes.prompt]: new PenmanStorageHeap(),
        };
        this.lastReadRecords = {
            [storageRecordTypes.authentication]: null,
            [storageRecordTypes.user]: null,
            [storageRecordTypes.prompt]: null,
        };
        this.subscriptions = {
            [storageRecordTypes.authentication]: {},
            [storageRecordTypes.user]: {},
            [storageRecordTypes.prompt]: {},
        };
        this.lookup = {};
    };
    StorageManager.prototype.readAccessed = function(storageRecordType, clientId) {
        this.lastReadRecords[storageRecordType] = this.lookup[clientId];
    };
    StorageManager.prototype.writeAccessed = function(storageRecordType, clientId) {
        const storageRecord = this.lookup[clientId];
        if (storageRecord) this.storageHeaps[storageRecordType].siftUp(storageRecord);
    };
    StorageManager.prototype.readStateFromLocalStorage = function(storageRecordType) {
        let state = {};
        let fromStorage = '';
        switch (storageRecordType) {
            case storageRecordTypes.authentication:
                fromStorage = localStorage.getItem(authConstants.AUTH_LOCAL_STORAGE_KEY) || 'null';
                if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
                else return defaultAuthenticationState;
                Object.assign(state, defaultAuthenticationState, { authenticatedUser: new AuthenticatedUser(this, nullUser) }, JSON.parse(fromStorage, (key, value) => {
                    if (key === 'offlineActionQueue') return value.map(dehydratedMemento => new AuthActionMemento(this, null, null, null, dehydratedMemento));
                    else if (key === 'authenticatedUser') return authenticatedUserFromSerializedJSON(this, value);
                    return value;
                }));
                break;

            case storageRecordTypes.prompt:
                fromStorage = localStorage.getItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY) || 'null';
                if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
                else return defaultPromptState;
                const promptUuidLookup = {};
                Object.assign(state, defaultPromptState, JSON.parse(fromStorage, (key, value) => {
                    if (key === 'offlineActionQueue') return value.map(dehydratedMemento => new PromptActionMemento(this, null, null, null, '', dehydratedMemento));
                    else if (key === 'lastReadAllDate') return new Date(value);
                    else if (key === 'prompts') {
                        return value.reduce((map, serializedObject) => {
                            const prompt = promptFromSerializedJSON(this, serializedObject);
                            promptUuidLookup[prompt.clientId] = prompt;
                            map[prompt.promptId] = prompt;
                            return map;
                        }, {});
                    } else if (key === '' && !!value) {
                        console.log(`storageManager prompt => key ${key}, value ${value} => ${key === '' && !!value}`);
                        value.uuidLookup = promptUuidLookup;
                        value.pendingActions = [];
                        value.promptErrorState = nullError;
                    }
                    return value;
                }));
                break;

            case storageRecordTypes.user:
            default:
                break;

        }
        return state;
    };
    StorageManager.prototype.writeStateToLocalStorage = function(storageRecordType, state) {
        // account for weights and prioritize
        const instance = this;
        switch (storageRecordType) {
            case storageRecordTypes.authentication:
                localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
                    authenticatedUser: state.authenticatedUser.serializeObject(persistenceTypes.heavy),
                    offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
                })));
                break;

            case storageRecordTypes.prompt:
                localStorage.setItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
                    prompts: Object.values(state.prompts).map(prompt => prompt.serializeObject(instance.lookup[prompt.clientId].persistenceLevel)),
                })));
                break;

            case storageRecordTypes.user:
            default:
                break;
        }
    };
    StorageManager.prototype.track = function(storageRecordType, item) {
        if (this.lookup[item.clientId]) {
            this.lookup[item.clientId].item = item;
        } else {
            const storageRecord = {
                clientId: item.clientId,
                storageRecordType,
                persistenceLevel: persistenceTypes.feather,
                item,
                heapNodeId: 0,
                heapIndex: function() { return this.heapNodeId - 1; },
            };
            this.lookup[item.clientId] = storageRecord;
            this.storageHeaps[storageRecordType].insert(storageRecord);
        }
    };
    StorageManager.prototype.untrack = function(storageRecordType, clientId) {
        const storageRecord = this.lookup[clientId];
        if (storageRecord) {
            this.storageHeaps[storageRecordType].remove(storageRecord);
            delete this.lookup[clientId];
        }
    };
    StorageManager.prototype.subscribe = function(targetStorageRecordType, targetClientId, subscriberClientId, callback) {
        const subscription = {
            subscriberClientId,
            callback,
        };
        if (this.subscriptions[targetStorageRecordType][targetClientId]) this.subscriptions[targetStorageRecordType][targetClientId].push(subscription);
        else this.subscriptions[targetStorageRecordType][targetClientId] = [subscription];
    };
    StorageManager.prototype.unsubscribe = function(targetStorageRecordType, targetClientId, subscriberClientId) {
        const subscriptionsForTarget = this.subscriptions[targetStorageRecordType][targetClientId];
        if (subscriptionsForTarget) {
            this.subscriptions[targetStorageRecordType][targetClientId] = subscriptionsForTarget
                .filter(subscription => subscription.subscriberClientId !== subscriberClientId);
        }
    };
    StorageManager.prototype.publish = function(targetStorageRecordType, clientIdHistory, item) {
        const instance = this;
        clientIdHistory.forEach(clientId => {
            const subscriptions = instance.subscriptions[targetStorageRecordType][clientId];
            if (subscriptions) subscriptions.forEach(subscription => subscription.callback(item));
        })
    };
    return StorageManager;
})();
