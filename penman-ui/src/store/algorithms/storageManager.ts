import { IStorageRecord, IStorageManager, StorageRecordType, PersistenceTypes } from '../type-defs/storage-types';
import { UUID, inflateBase64ToText, deflateTextToBase64 } from '../../utilities';
import { authConstants, promptConstants } from '../../constants';
import { defaultAuthenticationState, nullUser, AuthenticatedUser } from '../type-defs/auth-types';
import { defaultUserState, nullProfile, UserProfile } from '../type-defs/user-types';
import { defaultPromptState, nullPrompt, Prompt, IPromptState } from '../type-defs/prompt-types';
import { nullError } from '../type-defs/error-types';
import { IReplayableAction } from '../type-defs/offline-types';
import { AuthActionMemento } from '../actions/authActions';
import { PromptActionMemento } from '../actions/promptActions';

export interface IHeap {
    clone(): IHeap;
    insert(storageRecord: IStorageRecord): void;
    extract(): IStorageRecord | null;
    peek(): IStorageRecord | null;
    siftUp(storageRecord: IStorageRecord): void;
    siftDown(storageRecord: IStorageRecord): void;
    remove(storageRecord: IStorageRecord): void;
};

type NodeId = number;
interface ISubscription {
    subscriberClientId: UUID;
    callback: (item: any) => void;
};

// max-heap implementation where AuthenticatedUser instance is max, then write access, then read access
class PenmanStorageHeap implements IHeap {
    private _heap: IStorageRecord[];
    // private _lookup: Record<UUID, NodeId>;

    constructor(heap?: IStorageRecord[]) {
        this._heap = heap || [];
    }

    public clone() {
        return new PenmanStorageHeap(this._heap.slice());
    }

    private compare(left: IStorageRecord, right: IStorageRecord) {
        // max heap
        return (right.item.lastWriteAccessTime - left.item.lastWriteAccessTime);
    }

    public insert(storageRecord: IStorageRecord) {
        // heapId is 1 indexed while
        // heapIndex() is 0 indexed
        this._heap.push(storageRecord);
        let newItemHeapNodeId = this._heap.length;
        storageRecord.heapNodeId = newItemHeapNodeId;
        while (storageRecord.heapIndex()) {
            const parentNode = storageRecord.heapNodeId >> 1;
            const parentNodeStorageRecord = this._heap[parentNode - 1];
            if (this.compare(storageRecord, parentNodeStorageRecord) < 0) {
                // swap with parent
                this._heap[storageRecord.heapIndex()] = parentNodeStorageRecord;
                this._heap[parentNodeStorageRecord.heapIndex()] = storageRecord;
                newItemHeapNodeId = parentNode;
                parentNodeStorageRecord.heapNodeId = storageRecord.heapNodeId;
                storageRecord.heapNodeId = newItemHeapNodeId;
            } else break;
        }
    }

    public extract() {
        if (this._heap.length === 0) return null;
        let floatingItem = this._heap.pop();
        if (this._heap.length === 0 && floatingItem) return floatingItem || null;
        else if (!floatingItem) return null;
        let maxItem = this._heap[0];
        let floatingItemNodeId = 1;
        this._heap[0] = floatingItem;
        floatingItem.heapNodeId = floatingItemNodeId;
        this.siftDown(floatingItem);
        return maxItem;
    }

    public peek(): IStorageRecord | null {
        return this._heap.length
            ? this._heap[0]
            : null;
    }

    public siftUp(storageRecord: IStorageRecord) {
        // heapId values are 1-indexed
        // might want to change this to throw an error
        if (storageRecord.heapIndex() < 0 || storageRecord.heapNodeId > this._heap.length) return;
        while (storageRecord.heapIndex()) {
            let parentNodeId = storageRecord.heapNodeId >> 1;
            let parentNodeRecord = this._heap[parentNodeId - 1];
            if (this.compare(storageRecord, parentNodeRecord) < 0) {
                // swap
                this._heap[parentNodeRecord.heapIndex()] = storageRecord;
                this._heap[storageRecord.heapIndex()] = parentNodeRecord;
                let floatingItemNodeId = parentNodeId;
                parentNodeRecord.heapNodeId = storageRecord.heapNodeId;
                storageRecord.heapNodeId = floatingItemNodeId;
            } else break;
        }
    }

    public siftDown(storageRecord: IStorageRecord) {
        if (storageRecord.heapIndex() < 0 || storageRecord.heapNodeId > this._heap.length) return;
        while (storageRecord.heapNodeId < this._heap.length) {
            // check the children
            const leftChildNodeId = storageRecord.heapNodeId << 1;
            const rightChildNodeId = (storageRecord.heapNodeId << 1) + 1;
            // if there are no children, then the heap property has been restored
            if (leftChildNodeId > this._heap.length) break;
            const leftChildRecord = this._heap[leftChildNodeId - 1];
            if (rightChildNodeId > this._heap.length) {
                // only compare the left child
                if (this.compare(leftChildRecord, storageRecord) < 0) {
                    // swap
                    this._heap[leftChildRecord.heapIndex()] = storageRecord;
                    this._heap[storageRecord.heapIndex()] = leftChildRecord;
                    const floatingItemNodeId = leftChildRecord.heapNodeId;
                    leftChildRecord.heapNodeId = storageRecord.heapNodeId;
                    storageRecord.heapNodeId = floatingItemNodeId;
                } else break;
            } else {
                const rightChildRecord = this._heap[rightChildNodeId - 1];
                const useLeftChild = this.compare(leftChildRecord, rightChildRecord) <= 0;
                if (useLeftChild && this.compare(leftChildRecord, storageRecord) < 0) {
                    // swap
                    this._heap[leftChildRecord.heapIndex()] = storageRecord;
                    this._heap[storageRecord.heapIndex()] = leftChildRecord;
                    const floatingItemNodeId = leftChildNodeId;
                    leftChildRecord.heapNodeId = storageRecord.heapNodeId;
                    storageRecord.heapNodeId = floatingItemNodeId;
                } else if (!useLeftChild && this.compare(rightChildRecord, storageRecord) < 0) {
                    // swap
                    this._heap[rightChildRecord.heapIndex()] = storageRecord;
                    this._heap[storageRecord.heapIndex()] = rightChildRecord;
                    const floatingItemNodeId = rightChildNodeId;
                    rightChildRecord.heapNodeId = storageRecord.heapNodeId;
                    storageRecord.heapNodeId = floatingItemNodeId;
                } else break;
            }
        }
    }

    public remove(storageRecord: IStorageRecord) {
        if (storageRecord.heapIndex() < 0 || storageRecord.heapNodeId > this._heap.length) return;
        else if (storageRecord.heapNodeId === this._heap.length) {
            this._heap.pop();
            return;
        }
        // swap with the lowest ranking item, then check to see if we need to sift up or sift down
        const floatingItem = this._heap.pop();
        if (!floatingItem) return;
        this._heap[storageRecord.heapIndex()] = floatingItem;
        floatingItem.heapNodeId = storageRecord.heapNodeId;
        const parentNodeId = storageRecord.heapNodeId >> 1;
        const parentNodeRecord = this._heap[parentNodeId - 1];
        if (this.compare(floatingItem, parentNodeRecord) < 0) this.siftUp(floatingItem);
        else this.siftDown(floatingItem);
    }
}

export class StorageManager implements IStorageManager {
    // private _storageHeap: PenmanStorageHeap;
    private _storageHeaps: Record<StorageRecordType, PenmanStorageHeap>;
    private _lastReadRecords: Record<StorageRecordType, IStorageRecord | null>;
    private _subscriptions: Record<StorageRecordType, Record<UUID, ISubscription[]>>;
    private _lookup: Record<UUID, IStorageRecord>;

    constructor() {
        // this._storageHeap = new PenmanStorageHeap();
        this._storageHeaps = {
            [StorageRecordType.authentication]: new PenmanStorageHeap(),
            [StorageRecordType.user]: new PenmanStorageHeap(),
            [StorageRecordType.prompt]: new PenmanStorageHeap(),
        };
        this._lastReadRecords = {
            [StorageRecordType.authentication]: null,
            [StorageRecordType.user]: null,
            [StorageRecordType.prompt]: null,
        };
        this._subscriptions = {
            [StorageRecordType.authentication]: {},
            [StorageRecordType.user]: {},
            [StorageRecordType.prompt]: {},
        };
        this._lookup = {};
    }

    clear() {
        this._storageHeaps = {
            [StorageRecordType.authentication]: new PenmanStorageHeap(),
            [StorageRecordType.user]: new PenmanStorageHeap(),
            [StorageRecordType.prompt]: new PenmanStorageHeap(),
        };
        this._lastReadRecords = {
            [StorageRecordType.authentication]: null,
            [StorageRecordType.user]: null,
            [StorageRecordType.prompt]: null,
        };
        this._subscriptions = {
            [StorageRecordType.authentication]: {},
            [StorageRecordType.user]: {},
            [StorageRecordType.prompt]: {},
        };
        this._lookup = {};
    }

    public readAccessed(storageRecordType: StorageRecordType, clientId: UUID) {
        // we could optionally maintain a list of the most recently read
        // items of each StorageRecordType, and we may still do that,
        // but for now the emphasis is on work not leisure... i.e.
        // what is it that the user is working on
        this._lastReadRecords[storageRecordType] = this._lookup[clientId];
    }

    public writeAccessed(storageRecordType: StorageRecordType, clientId: UUID) {
        const storageRecord = this._lookup[clientId];
        if (storageRecord) this._storageHeaps[storageRecordType].siftUp(storageRecord);
    }

    public readStateFromLocalStorage(storageRecordType: StorageRecordType): any {
        let state: any = {};
        let fromStorage = '';
        switch (storageRecordType) {
            case StorageRecordType.authentication:
                fromStorage = localStorage.getItem(authConstants.AUTH_LOCAL_STORAGE_KEY) || 'null';
                if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
                Object.assign(state, defaultAuthenticationState, JSON.parse(fromStorage, (key: string, value: any) => {
                    if (key === 'offlineActionQueue') {
                        return value.map((memento: string) => AuthActionMemento.hydrate(this, memento));
                    } else if (key === 'authenticatedUser') {
                        return new AuthenticatedUser(this, nullUser);
                    }
                    return value;
                }));
                break;

            case StorageRecordType.user:
                // state = defaultUserState;
                break;

            case StorageRecordType.prompt:
                fromStorage = localStorage.getItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY) || 'null';
                if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
                const promptUuidLookup: Record<UUID, Prompt> = {};
                Object.assign(state, defaultPromptState, JSON.parse(fromStorage, (key: string, value: any) => {
                    if (key === 'offlineActionQueue') {
                        return value.map((memento: string) => PromptActionMemento.hydrate(this, memento));
                    } else if (key === 'prompts') {
                        const promptRecords: Record<number, Prompt> = value.reduce((map: Record<number, Prompt>, serializedObject: string) => {
                            const prompt = Prompt.fromSerializedJSON(this, serializedObject);
                            promptUuidLookup[prompt.clientId] = prompt;
                            map[prompt.promptId] = prompt;
                            return map;
                        }, {});
                        return promptRecords;
                    } else if (key === 'lastReadAllDate') {
                        return new Date(value);
                    } else if (key === '') {
                        value.uuidLookup = promptUuidLookup;
                        value.pendingActions = [];
                        value.promptErrorState = nullError;
                    }
                    return value;
                }));
                break;

            default:
                break;
        }
        return state;
    }

    public writeStateToLocalStorage(storageRecordType: StorageRecordType, state: any) {
        switch (storageRecordType) {
            case StorageRecordType.authentication:
                localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
                    authenticatedUser: state.authenticatedUser.toSerializedJSON(),
                    offlineActionQueue: state.offlineActionQueue.map((replayableAction: IReplayableAction) => replayableAction.serializedData),
                })));
                break;

            case StorageRecordType.user:
                break;

            case StorageRecordType.prompt:
                localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
                    prompts: Object.values((state as IPromptState).prompts).map((prompt: Prompt) => prompt.serialize()),
                    offlineActionQueue: state.offlineActionQueue.map((replayableAction: IReplayableAction) => replayableAction.serializedData),
                    lastReadAllDate: state.lastReadAllDate.toISOString(),
                })));
                break;

            default:
                break;
        }
    }

    public track(storageRecordType: StorageRecordType, item: any) {
        // use this method to insert into the heap, move the lookup from the heap (though clever)
        // to this object
        if (this._lookup[item.clientId]) {
            this._lookup[item.clientId].item = item;
        } else {
            const storageRecord: IStorageRecord = {
                clientId: item.clientId,
                storageRecordType,
                persistenceLevel: PersistenceTypes.feather, //forget as much as possible to start
                item,
                heapNodeId: 0,
                heapIndex: function() { return this.heapNodeId - 1; },
            };
            this._lookup[item.clientId] = storageRecord;
            this._storageHeaps[storageRecordType].insert(storageRecord);
        }
    }

    public untrack(storageRecordType: StorageRecordType, clientId: UUID) {
        // remove the record from the heap and from the local lookup
        const storageRecord = this._lookup[clientId];
        if (storageRecord) {
            // it's not worth breaking encapsulation to make this work... just add a siftDown and remove method
            // promote to the top, then remove the top
            this._storageHeaps[storageRecordType].remove(storageRecord);
            // remove from local storage
            delete this._lookup[clientId];
            // we cannot assume the item to have been deleted... it may just
            // be triage, so leave the subscriptions (if any)
        }
    }
    
    public subscribe(targetStorageRecordType: StorageRecordType, targetClientId: UUID, subscriberClientId: UUID, callback: (item: any) => void) {
        const subscription: ISubscription = {
            subscriberClientId,
            callback,
        };
        if (this._subscriptions[targetStorageRecordType][targetClientId]) this._subscriptions[targetStorageRecordType][targetClientId].push(subscription);
        else this._subscriptions[targetStorageRecordType][targetClientId] = [subscription];
    }

    public unsubscribe(targetStorageRecordType: StorageRecordType, targetClientId: UUID, subscriberClientId: UUID) {
        let subscriptionsForTarget = this._subscriptions[targetStorageRecordType][targetClientId];
        if (subscriptionsForTarget) {
            this._subscriptions[targetStorageRecordType][targetClientId] = subscriptionsForTarget
                .filter(subscription => subscription.subscriberClientId !== subscriberClientId);
        }
    }

    public publish(targetStorageRecordType: StorageRecordType, clientIdHistory: UUID[], item: any) {
        clientIdHistory.forEach((clientId: UUID) => {
            const subscriptions = this._subscriptions[targetStorageRecordType][clientId];
            if (subscriptions) subscriptions.forEach(subscription => subscription.callback(item));
        });
    }
}
