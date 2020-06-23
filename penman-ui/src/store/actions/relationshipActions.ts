import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, offlineConstants, relationshipConstants } from '../../constants';
import { IReplayableAction, Relationship, IReplayUser, IError, ErrorCodes, IClientRelationship, IRelationshipCollection, nullError } from '../types';

export class RelationshipActionMemento implements IReplayableAction {
    public relationship: Relationship;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string;
    public serializedData: string;

    constructor(relationship: Relationship, type: string, timestamp: number, lastReadAllISOString = '') {
        this.relationship = relationship;
        this.type = type;
        this.timestamp = timestamp;
        this.lastReadAllISOString = lastReadAllISOString;
        this.serializedData = RelationshipActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'relationship') return Relationship.fromSerializedJSON(value);
            else return value;
        });
        return new RelationshipActionMemento(restoredMemento.relationship, restoredMemento.type, restoredMemento.timestamp, restoredMemento.lastReadAllISOString);
    }

    static dehydrate(actionMemento: RelationshipActionMemento) {
        const serializedMemento = JSON.stringify({
            relationship: actionMemento.relationship.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAllISOString: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user: IReplayUser, isOffline: boolean) {
        switch (this.type) {
            case relationshipConstants.CREATE_NEW_RELATIONSHIP:
                this.create(user, isOffline, true);
                break;
            case relationshipConstants.UPDATE_RELATIONSHIP:
                this.update(user, isOffline, true);
                break;
            case relationshipConstants.DELETE_RELATIONSHIP:
                this.deleteEntity(user, isOffline, true);
                break;
            case relationshipConstants.READ_RELATIONSHIP:
                this.read(user, isOffline, true);
                break;
            case relationshipConstants.READ_ALL_RELATIONSHIPS:
                this.readAll(user, isOffline, true);
                break;
            default:
                break;
        }
    }

    public create(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.relationshipsController}/create`;
        const data = this.relationship.toCreateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: relationshipConstants.CREATE_NEW_RELATIONSHIP, payload: this.relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by relationship-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: relationshipConstants.CREATE_NEW_RELATIONSHIP_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.post(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientRelationship>) => {
            this.relationship.onApiProcessed(response.data, true);
            dispatch({ type: relationshipConstants.CREATE_NEW_RELATIONSHIP_SUCCESS, payload: this.relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: relationshipConstants.CREATE_NEW_RELATIONSHIP_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else if (err.response && err.response.data && err.response.data.errorCode === ErrorCodes.clientIdCollided) {
                this.relationship.handleIdCollision();
                this.create(user, isOffline);
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the new relationship: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: relationshipConstants.CREATE_NEW_RELATIONSHIP_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public update(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.relationshipsController}/update`;
        const data = this.relationship.toUpdateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: relationshipConstants.UPDATE_RELATIONSHIP, payload: this.relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: relationshipConstants.UPDATE_RELATIONSHIP_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.patch(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientRelationship>) => {
            this.relationship.onApiProcessed(response.data, true);
            dispatch({ type: relationshipConstants.UPDATE_RELATIONSHIP_SUCCESS, payload: this.relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: relationshipConstants.UPDATE_RELATIONSHIP_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the specified relationship: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: relationshipConstants.UPDATE_RELATIONSHIP_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public deleteEntity(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.relationshipsController}/delete?userId=${user.userId}&relationshipId=${this.relationship.relationshipId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: relationshipConstants.DELETE_RELATIONSHIP, payload: this.relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: relationshipConstants.DELETE_RELATIONSHIP_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: relationshipConstants.DELETE_RELATIONSHIP_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: relationshipConstants.DELETE_RELATIONSHIP_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to delete the specified relationship: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: relationshipConstants.DELETE_RELATIONSHIP_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public read(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.relationshipsController}/read?relationshipId=${this.relationship.relationshipId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: relationshipConstants.READ_RELATIONSHIP, payload: this.relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: relationshipConstants.READ_RELATIONSHIP_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IClientRelationship>) => {
            this.relationship.onApiProcessed(response.data);
            dispatch({ type: relationshipConstants.READ_RELATIONSHIP_SUCCESS, payload: this.relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: relationshipConstants.READ_RELATIONSHIP_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve the specified relationship: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: relationshipConstants.READ_RELATIONSHIP_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public readAll(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.relationshipsController}/readall?userId=${this.relationship.userId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: relationshipConstants.READ_ALL_RELATIONSHIPS, payload: this.relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: relationshipConstants.READ_ALL_RELATIONSHIPS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IRelationshipCollection>) => {
            const lastReadAll = new Date(response.data.lastReadAll);
            const relationshipCollection = response.data.relationships;
            relationshipCollection.forEach((relationshipDto) => {
                const relationship = new Relationship(relationshipDto);
                dispatch({ type: relationshipConstants.READ_RELATIONSHIP_SUCCESS, payload: relationship, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            });
            dispatch({ type: relationshipConstants.READ_ALL_RELATIONSHIPS_SUCCESS, payload: { targetUserId: this.relationship.userId, lastReadAll }, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: relationshipConstants.READ_ALL_RELATIONSHIPS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve all relationships for the specified book: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: relationshipConstants.READ_ALL_RELATIONSHIPS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        })
    }
}

export const create = (user: IReplayUser, newRelationship: Relationship, isOffline = false) => {
    const timestamp = Date.now();
    newRelationship.relationshipId = -timestamp;
    const memento = new RelationshipActionMemento(newRelationship, relationshipConstants.CREATE_NEW_RELATIONSHIP, timestamp);
    memento.create(user, isOffline);
};

export const update = (user: IReplayUser, relationship: Relationship, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new RelationshipActionMemento(relationship, relationshipConstants.UPDATE_RELATIONSHIP, timestamp);
    memento.update(user, isOffline);
};

export const deleteEntity = (user: IReplayUser, relationship: Relationship, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new RelationshipActionMemento(relationship, relationshipConstants.DELETE_RELATIONSHIP, timestamp);
    memento.deleteEntity(user, isOffline);
};

export const read = (user: IReplayUser, relationshipId: number, isOffline = false) => {
    const timestamp = Date.now();
    const relationship = new Relationship();
    relationship.relationshipId = relationshipId;
    const memento = new RelationshipActionMemento(relationship, relationshipConstants.READ_RELATIONSHIP, timestamp);
    memento.read(user, isOffline);
};

export const readAll = (user: IReplayUser, targetUserId: number, lastReadAll: Date, isOffline = false) => {
    const timestamp = Date.now();
    const dummyRelationship = new Relationship();
    dummyRelationship.userId = targetUserId;
    const memento = new RelationshipActionMemento(dummyRelationship, relationshipConstants.READ_ALL_RELATIONSHIPS, timestamp, lastReadAll.toISOString());
    memento.readAll(user, isOffline);
};
