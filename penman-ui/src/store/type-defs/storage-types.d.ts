import { UUID } from "../../utilities";

export enum PersistenceTypes {
    // never store
    forget = 0,
    // id, clientId, overlay
    feather = 1,
    // id, clientId, overlay, title, (possibly) summary
    light = 2,
    // everything
    heavy = 3,
};

export interface IPrioritizable {
    readonly weightHeavy: number;
    readonly weightLight: number;
    readonly lastReadAccessTime: number;
    readonly lastWriteAccessTime: number;
    readonly isPartial: boolean;
};

export abstract class PrioritizableStorageItem implements IPrioritizable {
    private _lastReadAccessTime: number = 0;
    private _lastWriteAccessTime: number = 0;
    protected _isPartial: boolean = false;
    protected _storageManager: IStorageManager;

    get weightHeavy(): number { return this.computeWeight(PersistenceTypes.heavy); }
    get weightLight(): number { return this.computeWeight(PersistenceTypes.light); }
    get weightFeather(): number { return this.computeWeight(PersistenceTypes.feather); }
    get lastReadAccessTime(): number { return this._lastReadAccessTime; }
    get lastWriteAccessTime(): number { return this._lastWriteAccessTime; }
    get isPartial(): boolean { return this._isPartial; }

    constructor(storageManager: IStorageManager) {
        this._storageManager = storageManager;
    }

    protected readAccessed(storageRecordType: StorageRecordType, clientId: UUID): void { 
        this._lastReadAccessTime = Date.now();
        this._storageManager.readAccessed(storageRecordType, clientId);
    }

    protected writeAccessed(storageRecordType: StorageRecordType, clientId: UUID): void {
        this._lastWriteAccessTime = Date.now();
        this._storageManager.writeAccessed(storageRecordType, clientId);
    }

    abstract computeWeight(persistenceType: PersistenceTypes = PersistenceTypes.heavy): number;
    abstract serialize(persistenceType: PersistenceTypes = PersistenceTypes.heavy): string;
    abstract toCreateDto(): any;
    abstract toUpdateDto(): any;
    abstract isDirty(): boolean;
}

export enum StorageRecordType {
    authentication = 0,
    user = 1,
    prompt = 2,
};

export interface IStorageRecord {
    clientId: UUID;
    storageRecordType: StorageRecordType;
    persistenceLevel: PersistenceTypes;
    item: IPrioritizable;
    heapNodeId: number;
    heapIndex(): number;
};

export interface IStorageManager {
    readAccessed(storageRecordType: StorageRecordType, clientId: UUID): void;
    writeAccessed(storageRecordType: StorageRecordType, clientId: UUID): void;

    readStateFromLocalStorage(storageRecordType: StorageRecordType): any;
    writeStateToLocalStorage(storageRecordType: StorageRecordType, state: any): void;

    track(storageRecordType: StorageRecordType, item: any): void;
    untrack(storageRecordType: StorageRecordType, clientId: UUID): void;

    subscribe(targetStorageRecordType: StorageRecordType, targetClientId: UUID, subscriberClientId: UUID, callback: (item: any) => void): void;
    unsubscribe(targetStorageRecordType: StorageRecordType, targetClientId: UUID, subscriberClientId: UUID): void;
    publish(targetStorageRecordType: StorageRecordType, clientIdHistory: UUID[], item: any): void;

    clear(): void;
};
