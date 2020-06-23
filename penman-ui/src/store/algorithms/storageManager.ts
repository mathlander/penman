import { IAuthenticationState, defaultAuthenticationState, AuthenticatedUser } from '../type-defs/auth-types';
import { IBookState } from '../type-defs/book-types';
import { IChapterState } from '../type-defs/chapter-types';
import { IPersonificationState } from '../type-defs/personification-types';
import { IPromptState } from '../type-defs/prompt-types';
import { IRelationshipState } from '../type-defs/relationship-types';
import { IShortState } from '../type-defs/short-types';
import { ITagState } from '../type-defs/tag-types';
import { UUID, deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { IStorageRecord, PersistenceTypes, PrioritizableStorageItem } from '../type-defs/storage-types';
import { authConstants } from '../../constants';
import { AuthActionMemento } from '../actions/authActions';
import { IReplayableAction } from '../type-defs/offline-types';

export interface IStorageManager {
    uuidLookup: Record<UUID, IStorageRecord>;
    // readonly usedLocalStorage: number; // bytes
    // readonly targetedMax: number; // bytes
    readLocalStorage(key: string): any;
    updateLocalStorage(key: string, state: any): void;
};

export const StorageManager: IStorageManager = (function() {
    const uuidLookup: Record<UUID, IStorageRecord> = {};
    const priorityQueue = [];

    const readLocalStorage = (key: string): any => {
        let state: any = {};
        let fromStorage: string = '';
        switch (key) {
            case authConstants.AUTH_LOCAL_STORAGE_KEY:
                fromStorage = localStorage.getItem(authConstants.AUTH_LOCAL_STORAGE_KEY) || 'null';
                if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
                Object.assign(state, defaultAuthenticationState, JSON.parse(fromStorage, (key: string, value: any) => {
                    if (key === 'offlineActionQueue') {
                        return value.map((memento: string) => AuthActionMemento.hydrate(memento));
                    } else if (key === 'authenticatedUser') {
                        return new AuthenticatedUser(value);
                    }
                    return value;
                }));
                break;

            default:
                break;
        }
        return state;
    };

    const updateLocalStorage = (key: string, state: any): void => {
        switch (key) {
            case authConstants.AUTH_LOCAL_STORAGE_KEY:
                let authState: IAuthenticationState = state;
                localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
                    authenticatedUser: authState.authenticatedUser.toSerializedJSON(),
                    offlineActionQueue: state.offlineActionQueue.map((replayableAction: IReplayableAction) => replayableAction.serializedData),
                })));
                break;

            default:
                break;
        }
    };

    return {
        uuidLookup,
        readLocalStorage,
        updateLocalStorage,
    };
}());


// // try to limit the client-side persistence to under 2MB
// const storageLimit = 2 << 20;

// authReducer
/**
const updateLocalStorage = (state: IAuthenticationState): void => {
    localStorage.setItem(authConstants.AUTH_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        authenticatedUser: state.authenticatedUser.toSerializedJSON(),
        authErrorState: nullError,
        pendingActions: [],
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
    })));
};
 */

// bookReducer
/**
const readLocalStorage = (): IBookState => {
    let fromStorage = localStorage.getItem(bookConstants.BOOK_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Book> = {};
    return Object.assign(
        {},
        defaultBookState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => BookActionMemento.hydrate(memento));
            } else if (key === 'books') {
                const bookRecords: Record<number, Book> = value.reduce((map: Record<number, Book>, serializedObject: string) => {
                    const book = Book.fromSerializedJSON(serializedObject);
                    uuidLookup[book.clientId] = book;
                    map[book.bookId] = book;
                    return map;
                }, {});
                return bookRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.bookErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IBookState): void => {
    localStorage.setItem(bookConstants.BOOK_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        books: Object.values(state.books).map(book => book.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};
 */

// chapterReducer
/**
const readLocalStorage = (): IChapterState => {
    let fromStorage = localStorage.getItem(chapterConstants.CHAPTER_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let bookIdLookup: Record<number, Record<number, Chapter>> = {};
    let uuidLookup: Record<UUID, Chapter> = {};
    return Object.assign(
        {},
        defaultChapterState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => ChapterActionMemento.hydrate(memento));
            } else if (key === 'chapters') {
                const chapterRecords: Record<number, Chapter> = value.reduce((map: Record<number, Chapter>, serializedObject: string) => {
                    const chapter = Chapter.fromSerializedJSON(serializedObject);
                    uuidLookup[chapter.clientId] = chapter;
                    if (bookIdLookup[chapter.bookId]) bookIdLookup[chapter.bookId][chapter.chapterId] = chapter;
                    else bookIdLookup[chapter.bookId] = { [chapter.chapterId]: chapter };
                    map[chapter.chapterId] = chapter;
                    return map;
                }, {});
                return chapterRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.bookIdLookup = bookIdLookup;
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.chapterErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IChapterState): void => {
    localStorage.setItem(chapterConstants.CHAPTER_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        chapters: Object.values(state.chapters).map(chapter => chapter.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};
 */

// personificationReducer
/**
const readLocalStorage = (): IPersonificationState => {
    let fromStorage = localStorage.getItem(personificationConstants.PERSONIFICATION_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Personification> = {};
    return Object.assign(
        {},
        defaultPersonificationState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => PersonificationActionMemento.hydrate(memento));
            } else if (key === 'personifications') {
                const personificationRecords: Record<number, Personification> = value.reduce((map: Record<number, Personification>, serializedObject: string) => {
                    const personification = Personification.fromSerializedJSON(serializedObject);
                    uuidLookup[personification.clientId] = personification;
                    map[personification.personificationId] = personification;
                    return map;
                }, {});
                return personificationRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.personificationErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IPersonificationState): void => {
    localStorage.setItem(personificationConstants.PERSONIFICATION_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        personifications: Object.values(state.personifications).map(personification => personification.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};
 */

// promptReducer
/**
const readLocalStorage = (): IPromptState => {
    let fromStorage = localStorage.getItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Prompt> = {};
    return Object.assign(
        {},
        defaultPromptState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => PromptActionMemento.hydrate(memento));
            } else if (key === 'prompts') {
                const promptRecords: Record<number, Prompt> = value.reduce((map: Record<number, Prompt>, serializedObject: string) => {
                    const prompt = Prompt.fromSerializedJSON(serializedObject);
                    uuidLookup[prompt.clientId] = prompt;
                    map[prompt.promptId] = prompt;
                    return map;
                }, {});
                return promptRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.promptErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IPromptState): void => {
    localStorage.setItem(promptConstants.PROMPT_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        prompts: Object.values(state.prompts).map(prompt => prompt.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};
 */

// shortReducer
/**
const readLocalStorage = (): IShortState => {
    let fromStorage = localStorage.getItem(shortConstants.SHORT_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Short> = {};
    return Object.assign(
        {},
        defaultShortState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => ShortActionMemento.hydrate(memento));
            } else if (key === 'shorts') {
                const shortRecords: Record<number, Short> = value.reduce((map: Record<number, Short>, serializedObject: string) => {
                    const short = Short.fromSerializedJSON(serializedObject);
                    uuidLookup[short.clientId] = short;
                    map[short.shortId] = short;
                    return map;
                }, {});
                return shortRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.shortErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IShortState): void => {
    localStorage.setItem(shortConstants.SHORT_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        shorts: Object.values(state.shorts).map(short => short.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};
 */

// tagReducer
/**
const readLocalStorage = (): ITagState => {
    let fromStorage = localStorage.getItem(tagConstants.TAG_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let uuidLookup: Record<UUID, Tag> = {};
    return Object.assign(
        {},
        defaultTagState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => TagActionMemento.hydrate(memento));
            } else if (key === 'tags') {
                const tagRecords: Record<number, Tag> = value.reduce((map: Record<number, Tag>, serializedObject: string) => {
                    const tag = Tag.fromSerializedJSON(serializedObject);
                    uuidLookup[tag.clientId] = tag;
                    map[tag.tagId] = tag;
                    return map;
                }, {});
                return tagRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.tagErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: ITagState): void => {
    localStorage.setItem(tagConstants.TAG_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        tags: Object.values(state.tags).map(tag => tag.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};
 */

// relationshipReducer
/**
const readLocalStorage = (): IRelationshipState => {
    let fromStorage = localStorage.getItem(relationshipConstants.RELATIONSHIP_LOCAL_STORAGE_KEY) || 'null';
    if (fromStorage !== 'null') fromStorage = inflateBase64ToText(fromStorage);
    let objectUuidLookup: Record<UUID, Record<number, Relationship>> = {};
    let chipUuidLookup: Record<UUID, Record<number, Relationship>> = {};
    let uuidLookup: Record<UUID, Relationship> = {};
    return Object.assign(
        {},
        defaultRelationshipState,
        JSON.parse(fromStorage, (key: string, value: any) => {
            if (key === 'offlineActionQueue') {
                return value.map((memento: string) => RelationshipActionMemento.hydrate(memento));
            } else if (key === 'relationships') {
                const relationshipRecords: Record<number, Relationship> = value.reduce((map: Record<number, Relationship>, serializedObject: string) => {
                    const relationship = Relationship.fromSerializedJSON(serializedObject);
                    uuidLookup[relationship.clientId] = relationship;
                    if (objectUuidLookup[relationship.objectClientId]) objectUuidLookup[relationship.objectClientId][relationship.relationshipId] = relationship;
                    else objectUuidLookup[relationship.objectClientId] = { [relationship.relationshipId]: relationship };
                    if (chipUuidLookup[relationship.chipClientId]) chipUuidLookup[relationship.chipClientId][relationship.relationshipId] = relationship;
                    else chipUuidLookup[relationship.chipClientId] = { [relationship.relationshipId]: relationship };
                    map[relationship.relationshipId] = relationship;
                    return map;
                }, {});
                return relationshipRecords;
            } else if (key === 'lastReadAll') {
                return new Date(value);
            } else if (key === '') {
                value.objectUuidLookup = objectUuidLookup;
                value.chipUuidLookup = chipUuidLookup;
                value.uuidLookup = uuidLookup;
                value.pendingActions = [];
                value.relationshipErrorState = nullError;
            }
            return value;
        }));
};

const updateLocalStorage = (state: IRelationshipState): void => {
    localStorage.setItem(relationshipConstants.RELATIONSHIP_LOCAL_STORAGE_KEY, deflateTextToBase64(JSON.stringify({
        relationships: Object.values(state.relationships).map(relationship => relationship.toSerializedJSON()),
        offlineActionQueue: state.offlineActionQueue.map(replayableAction => replayableAction.serializedData),
        lastReadAll: state.lastReadAll.toISOString(),
    })));
};
 */


