import { relationshipConstants } from '../../constants';
import { Relationship, IRelationshipState, IRelationshipAction, nullError, apiUnreachableError, defaultRelationshipState, UUID } from '../types';
import { RelationshipActionMemento } from '../actions/relationshipActions';
import { deflateTextToBase64, inflateBase64ToText } from '../utilities';
import { ErrorCodes } from '../type-defs/error-types';

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

const initState: IRelationshipState = readLocalStorage();

const relationshipReducer = (state: IRelationshipState = initState, action: IRelationshipAction): IRelationshipState => {
    let nextState = state;
    switch (action.type) {
        case relationshipConstants.RELATIONSHIP_CLEAR_ERROR:
            nextState = {
                ...state,
                relationshipErrorState: nullError,
            };
            return nextState;
        case relationshipConstants.CANCEL_RELATIONSHIP_ACTION:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;

        case relationshipConstants.CREATE_NEW_RELATIONSHIP:
            const pendingNewRelationship: Relationship = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingNewRelationship.clientId]: pendingNewRelationship,
                },
                objectUuidLookup: {
                    ...state.objectUuidLookup,
                    [pendingNewRelationship.objectClientId]: state.objectUuidLookup[pendingNewRelationship.objectClientId]
                        ? { ...state.objectUuidLookup[pendingNewRelationship.objectClientId], [pendingNewRelationship.relationshipId]: pendingNewRelationship, }
                        : { [pendingNewRelationship.relationshipId]: pendingNewRelationship, },
                },
                chipUuidLookup: {
                    ...state.chipUuidLookup,
                    [pendingNewRelationship.chipClientId]: state.chipUuidLookup[pendingNewRelationship.chipClientId]
                        ? { ...state.chipUuidLookup[pendingNewRelationship.chipClientId], [pendingNewRelationship.relationshipId]: pendingNewRelationship, }
                        : { [pendingNewRelationship.relationshipId]: pendingNewRelationship, },
                },
                relationships: {
                    ...state.relationships,
                    [-action.timestamp]: pendingNewRelationship,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.CREATE_NEW_RELATIONSHIP_ERROR:
            const failedNewRelationship: Relationship = action.payload;
            nextState = {
                ...state,
                relationshipErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to create the specified relationship definition.',
                    internalErrorMessage: 'An unidentified error occurred while attempting to submit the new relationship to the API.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.relationships[-action.timestamp];
            delete nextState.objectUuidLookup[failedNewRelationship.objectClientId][-action.timestamp];
            delete nextState.chipUuidLookup[failedNewRelationship.chipClientId][-action.timestamp];
            delete nextState.uuidLookup[failedNewRelationship.clientId];
            updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.CREATE_NEW_RELATIONSHIP_SUCCESS:
            const newRelationship: Relationship = action.payload;
            nextState = {
                ...state,
                objectUuidLookup: {
                    ...state.objectUuidLookup,
                    [newRelationship.objectClientId]: {
                        ...state.objectUuidLookup[newRelationship.objectClientId],
                        [newRelationship.relationshipId]: newRelationship,
                    },
                },
                chipUuidLookup: {
                    ...state.chipUuidLookup,
                    [newRelationship.chipClientId]: {
                        ...state.chipUuidLookup[newRelationship.chipClientId],
                        [newRelationship.relationshipId]: newRelationship,
                    },
                },
                relationships: {
                    ...state.relationships,
                    [newRelationship.relationshipId]: newRelationship,
                },
                relationshipErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            delete nextState.relationships[-action.timestamp];
            delete nextState.objectUuidLookup[newRelationship.objectClientId][-action.timestamp];
            delete nextState.chipUuidLookup[newRelationship.chipClientId][-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.CREATE_NEW_RELATIONSHIP_TIMEOUT:
            nextState = {
                ...state,
                relationshipErrorState: action.suppressTimeoutAlert
                    ? state.relationshipErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case relationshipConstants.UPDATE_RELATIONSHIP:
            const pendingUpdatedRelationship: Relationship = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [pendingUpdatedRelationship.clientId]: pendingUpdatedRelationship,
                },
                objectUuidLookup: {
                    ...state.objectUuidLookup,
                    [pendingUpdatedRelationship.objectClientId]: state.objectUuidLookup[pendingUpdatedRelationship.objectClientId]
                        ? { ...state.objectUuidLookup[pendingUpdatedRelationship.objectClientId], [pendingUpdatedRelationship.relationshipId]: pendingUpdatedRelationship, }
                        : { [pendingUpdatedRelationship.relationshipId]: pendingUpdatedRelationship, },
                },
                chipUuidLookup: {
                    ...state.chipUuidLookup,
                    [pendingUpdatedRelationship.chipClientId]: state.chipUuidLookup[pendingUpdatedRelationship.chipClientId]
                        ? { ...state.chipUuidLookup[pendingUpdatedRelationship.chipClientId], [pendingUpdatedRelationship.relationshipId]: pendingUpdatedRelationship, }
                        : { [pendingUpdatedRelationship.relationshipId]: pendingUpdatedRelationship, },
                },
                relationships: {
                    ...state.relationships,
                    [pendingUpdatedRelationship.relationshipId]: pendingUpdatedRelationship,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.UPDATE_RELATIONSHIP_ERROR:
            nextState = {
                ...state,
                relationshipErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to update the specified relationship.',
                    internalErrorMessage: 'The API returned an error while attempting to update the specified relationship.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.UPDATE_RELATIONSHIP_SUCCESS:
            const updatedRelationship: Relationship = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [updatedRelationship.clientId]: updatedRelationship,
                },
                objectUuidLookup: {
                    ...state.objectUuidLookup,
                    [updatedRelationship.objectClientId]: state.objectUuidLookup[updatedRelationship.objectClientId]
                        ? { ...state.objectUuidLookup[updatedRelationship.objectClientId], [updatedRelationship.relationshipId]: updatedRelationship, }
                        : { [updatedRelationship.relationshipId]: updatedRelationship, },
                },
                chipUuidLookup: {
                    ...state.chipUuidLookup,
                    [updatedRelationship.chipClientId]: state.chipUuidLookup[updatedRelationship.chipClientId]
                        ? { ...state.chipUuidLookup[updatedRelationship.chipClientId], [updatedRelationship.relationshipId]: updatedRelationship, }
                        : { [updatedRelationship.relationshipId]: updatedRelationship, },
                },
                relationships: {
                    ...state.relationships,
                    [updatedRelationship.relationshipId]: updatedRelationship,
                },
                relationshipErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.UPDATE_RELATIONSHIP_TIMEOUT:
            nextState = {
                ...state,
                relationshipErrorState: action.suppressTimeoutAlert
                    ? state.relationshipErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case relationshipConstants.DELETE_RELATIONSHIP:
            const deletedRelationship: Relationship = action.payload;
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            delete nextState.uuidLookup[deletedRelationship.clientId];
            delete nextState.objectUuidLookup[deletedRelationship.objectClientId][deletedRelationship.relationshipId];
            delete nextState.objectUuidLookup[deletedRelationship.objectClientId][-action.timestamp];
            delete nextState.chipUuidLookup[deletedRelationship.chipClientId][deletedRelationship.relationshipId];
            delete nextState.chipUuidLookup[deletedRelationship.chipClientId][-action.timestamp];
            delete nextState.relationships[deletedRelationship.relationshipId];
            delete nextState.relationships[-action.timestamp];
            updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.DELETE_RELATIONSHIP_ERROR:
            nextState = {
                ...state,
                relationshipErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to delete this relationship.',
                    internalErrorMessage: 'The API returned an error while attempting to delete the relationship.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.DELETE_RELATIONSHIP_SUCCESS:
            nextState = {
                ...state,
                relationshipErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.DELETE_RELATIONSHIP_TIMEOUT:
            nextState = {
                ...state,
                relationshipErrorState: action.suppressTimeoutAlert
                    ? state.relationshipErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case relationshipConstants.READ_RELATIONSHIP:
            // const readingRelationship: Relationship = action.payload;
            nextState = {
                ...state,
                // relationships: {
                //     ...state.relationships,
                //     [readingRelationship.relationshipId]: readingRelationship,
                // },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.READ_RELATIONSHIP_ERROR:
            nextState = {
                ...state,
                relationshipErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified relationship',
                    internalErrorMessage: 'The API returned an error while attempting to read the specified relationship.',
                    errorCode: ErrorCodes.unknown,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.READ_RELATIONSHIP_SUCCESS:
            const retrievedRelationship: Relationship = action.payload;
            nextState = {
                ...state,
                uuidLookup: {
                    ...state.uuidLookup,
                    [retrievedRelationship.clientId]: retrievedRelationship,
                },
                objectUuidLookup: {
                    ...state.objectUuidLookup,
                    [retrievedRelationship.objectClientId]: state.objectUuidLookup[retrievedRelationship.objectClientId]
                        ? { ...state.objectUuidLookup[retrievedRelationship.objectClientId], [retrievedRelationship.relationshipId]: retrievedRelationship, }
                        : { [retrievedRelationship.relationshipId]: retrievedRelationship, },
                },
                chipUuidLookup: {
                    ...state.chipUuidLookup,
                    [retrievedRelationship.chipClientId]: state.chipUuidLookup[retrievedRelationship.chipClientId]
                        ? { ...state.chipUuidLookup[retrievedRelationship.chipClientId], [retrievedRelationship.relationshipId]: retrievedRelationship, }
                        : { [retrievedRelationship.relationshipId]: retrievedRelationship, },
                },
                relationships: {
                    ...state.relationships,
                    [retrievedRelationship.relationshipId]: retrievedRelationship,
                },
                relationshipErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.READ_RELATIONSHIP_TIMEOUT:
            nextState = {
                ...state,
                relationshipErrorState: action.suppressTimeoutAlert
                    ? state.relationshipErrorState
                    : action.error || apiUnreachableError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.memento) nextState.offlineActionQueue.push(action.memento);
            updateLocalStorage(nextState);
            return nextState;

        case relationshipConstants.READ_ALL_RELATIONSHIPS:
            nextState = {
                ...state,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            nextState.pendingActions.push(action);
            // updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.READ_ALL_RELATIONSHIPS_ERROR:
            nextState = {
                ...state,
                relationshipErrorState: action.error || {
                    displayErrorMessage: 'An error occurred while attempting to retrieve the specified relationship collection.',
                    internalErrorMessage: 'The API returned an error while attempting to read all relationships for the given author.',
                    errorCode: ErrorCodes.apiUnreachable,
                },
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
            };
            // updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.READ_ALL_RELATIONSHIPS_SUCCESS:
            // may want to create another lookup by userId (action.payload.targetUserId)
            nextState = {
                ...state,
                relationshipErrorState: nullError,
                pendingActions: state.pendingActions.filter(pendingAction => pendingAction.timestamp !== action.timestamp),
                offlineActionQueue: state.offlineActionQueue.filter(queuedAction => queuedAction.timestamp !== action.timestamp),
            };
            if (action.payload.authenticatedUserId === action.payload.targetUserId) nextState.lastReadAll = action.payload.lastReadAll;
            updateLocalStorage(nextState);
            return nextState;
        case relationshipConstants.READ_ALL_RELATIONSHIPS_TIMEOUT:
            nextState = {
                ...state,
                relationshipErrorState: action.suppressTimeoutAlert
                    ? state.relationshipErrorState
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

export default relationshipReducer;
