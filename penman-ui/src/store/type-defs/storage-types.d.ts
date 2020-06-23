export enum PersistenceTypes {
    // never store
    forget = 0,
    // id, overlay
    feather = 1,
    // id, overlay, title, (possibly) summary
    light = 2,
    // everything
    heavy = 3,
};

export interface IPrioritizable {
    readonly weightHeavy: number;
    readonly weightLight: number;
    readonly lastReadAccess: number;
    readonly lastWriteAccess: number;
    readonly isPartial: boolean;
};

export abstract class PrioritizableStorageItem implements IPrioritizable {
    private _lastReadAccess: number = 0;
    private _lastWriteAccess: number = 0;
    protected _isPartial: boolean = false;

    get weightHeavy(): number { return this.computeWeight(PersistenceTypes.heavy); }
    get weightLight(): number { return this.computeWeight(PersistenceTypes.light); }
    get weightFeather(): number { return this.computeWeight(PersistenceTypes.feather); }
    get lastReadAccess(): number { return this._lastReadAccess; }
    get lastWriteAccess(): number { return this._lastWriteAccess; }
    get isPartial(): boolean { return this._isPartial; }
    get isDirty(): boolean { return this._isDirty; }

    protected readAccessed(): void { this._lastReadAccess = Date.now(); }
    protected writeAccessed(): void { this._lastWriteAccess = Date.now(); }

    abstract computeWeight(persistenceType: PersistenceTypes = PersistenceTypes.heavy): number;
    abstract serialize(persistenceType: PersistenceTypes = PersistenceTypes.heavy): string;
    abstract restore(serializedData: string): any;
    abstract toCreateDto(): any;
    abstract toUpdateDto(): any;
    abstract isDirty(): boolean;
}

export enum StorageRecordType {
    book = 1,
    chapter = 2,
    personification = 3,
    prompt = 4,
    short = 5,
    tag = 6,
    relationship = 7,
};

export interface IStorageRecord {
    clientId: UUID;
    storageRecordType: StorageRecordType;
    persistenceLevel: PersistenceTypes;
    item: any;
};
