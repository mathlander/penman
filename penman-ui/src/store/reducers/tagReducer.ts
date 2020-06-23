import { tagConstants } from '../../constants';
import { Tag, ITagState, ITagAction, nullError, apiUnreachableError, defaultTagState, UUID } from '../types';
import { TagActionMemento } from '../actions/tagActions';
import { deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { ErrorCodes } from '../type-defs/error-types';

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

const initState: ITagState = readLocalStorage();

const tagReducer = (state: ITagState = initState, action: ITagAction): ITagState => {
    let nextState = state;
    switch (action.type) {
        case tagConstants.TAG_CLEAR_ERROR:
            nextState = {
                ...state,
                tagErrorState: nullError,
            };
            return nextState;
        case tagConstants.CANCEL_TAG_ACTION:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case tagConstants.CREATE_NEW_TAG:
            const pendingNewTag: Tag = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingNewTag.clientId]: pendingNewTag,
                },
                tags: {
                    ...state.tags,
                    [-action.timestamp]: pendingNewTag,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case tagConstants.CREATE_NEW_TAG_ERROR:
            const failedNewTag: Tag = action.payload;
            nextState = {
                ...state,
                tagErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to create the specified tag definition.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new tag to the API.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.tags[-action.timestamp];
            delete nextState.uuidLookup[failedNewTag.clientId];
            updateLocalStorage(nextState);
            return nextState;
        case tagConstants.CREATE_NEW_TAG_SUCCESS:
            const newTag: Tag = action.payload;
            nextState = {
                ...state,
                tags: {
                    ...state.tags,
                    [newTag.tagId]: newTag,
                },
                tagErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.tags[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case tagConstants.CREATE_NEW_TAG_TIMEOUT:
            nextState = {
                ...state,
                tagErrorState: action.suppressTimeoutAlert
                    ? state.tagErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case tagConstants.UPDATE_TAG:
            const pendingUpdatedTag: Tag = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingUpdatedTag.clientId]: pendingUpdatedTag,
                },
                tags: {
                    ...state.tags,
                    [pendingUpdatedTag.tagId]: pendingUpdatedTag,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case tagConstants.UPDATE_TAG_ERROR:
            nextState = {
                ...state,
                tagErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to update the specified tag.',
                    internalErrorMessage: 'The API returned an error while attempting to update the specified tag.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case tagConstants.UPDATE_TAG_SUCCESS:
            const updatedTag: Tag = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [updatedTag.clientId]: updatedTag,
                },
                tags: {
                    ...state.tags,
                    [updatedTag.tagId]: updatedTag,
                },
                tagErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case tagConstants.UPDATE_TAG_TIMEOUT:
            nextState = {
                ...state,
                tagErrorState: action.suppressTimeoutAlert
                    ? state.tagErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case tagConstants.DELETE_TAG:
            const deletedTag: Tag = action.payload;
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            delete nextState.uuidLookup[deletedTag.clientId];
            delete nextState.tags[deletedTag.tagId];
            delete nextState.tags[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case tagConstants.DELETE_TAG_ERROR:
            nextState = {
                ...state,
                tagErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to delete this tag.',
                    internalErrorMessage: 'The API returned an error while attempting to delete the tag.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case tagConstants.DELETE_TAG_SUCCESS:
            nextState = {
                ...state,
                tagErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case tagConstants.DELETE_TAG_TIMEOUT:
            nextState = {
                ...state,
                tagErrorState: action.suppressTimeoutAlert
                    ? state.tagErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case tagConstants.READ_TAG:
            // const readingTag: Tag = action.payload;
            nextState = {
                ...state,
                // tags: {
                //     ...state.tags,
                //     [readingTag.tagId]: readingTag,
                // },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case tagConstants.READ_TAG_ERROR:
            nextState = {
                ...state,
                tagErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified tag',
                    internalErrorMessage: 'The API returned an error while attempting to read the specified tag.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case tagConstants.READ_TAG_SUCCESS:
            const retrievedTag: Tag = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [retrievedTag.clientId]: retrievedTag,
                },
                tags: {
                    ...state.tags,
                    [retrievedTag.tagId]: retrievedTag,
                },
                tagErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case tagConstants.READ_TAG_TIMEOUT:
            nextState = {
                ...state,
                tagErrorState: action.suppressTimeoutAlert
                    ? state.tagErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case tagConstants.READ_ALL_TAGS:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case tagConstants.READ_ALL_TAGS_ERROR:
            nextState = {
                ...state,
                tagErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified tag collection.',
                    internalErrorMessage: 'The API returned an error while attempting to read all tags for the given author.',
                    errorCode: ErrorCodes.apiUnreachable,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case tagConstants.READ_ALL_TAGS_SUCCESS:
            // may want to create another lookup by userId (action.payload.targetUserId)
            nextState = {
                ...state,
                tagErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.payload.authenticatedUserId === action.payload.targetUserId) nextState.lastReadAll = action.payload.lastReadAll;
            updateLocalStorage(nextState);
            return nextState;
        case tagConstants.READ_ALL_TAGS_TIMEOUT:
            nextState = {
                ...state,
                tagErrorState: action.suppressTimeoutAlert
                    ? state.tagErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        default:
            return state;
    }
};

export default tagReducer;
