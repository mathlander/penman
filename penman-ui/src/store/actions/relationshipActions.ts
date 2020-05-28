import axios, { AxiosRequestConfig } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, relationshipConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IDeleteRelationship, INewRelationship, IRelationshipErrorState, IReplayableAction, restoreOfflineWorkItemFromJSON } from '../types';

export class RelationshipActionMemento implements IReplayableAction {
    public newRelationship: INewRelationship | null = null;
    public deleteRelationship: IDeleteRelationship | null = null;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string = '';
    public serializedData: string;

    constructor(newRelationship: INewRelationship | null, deleteRelationship: IDeleteRelationship | null, type: string, timestamp: number) {
        this.newRelationship = newRelationship;
        this.deleteRelationship = deleteRelationship;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = RelationshipActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento);
        const relationshipMemento = new RelationshipActionMemento(restoredMemento.newRelationship, restoredMemento.deleteRelationship, restoredMemento.type, restoredMemento.timestamp);
        relationshipMemento.lastReadAllISOString = restoredMemento.lastReadAllISOString || '';
        relationshipMemento.serializedData = memento;
        return relationshipMemento;
    }

    static dehydrate(actionMemento: RelationshipActionMemento) {
        const serializedMemento = JSON.stringify({
            newRelationship: actionMemento.newRelationship,
            deleteRelationship: actionMemento.deleteRelationship,
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAll: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user:IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        switch(this.type) {
            case relationshipConstants.RELATE_ENTITIES:
                this.relate(user, suppressTimeoutAlert);
                break;
            case relationshipConstants.UNRELATE_ENTITIES:
                this.deleteEntity(user, suppressTimeoutAlert);
                break;
            default:
                break;
        }
    }

    public relate(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.relationshipsController}/relate`;
        const data = this.newRelationship;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: relationshipConstants.RELATE_ENTITIES, payload: this.newRelationship, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            dispatch({ type: relationshipConstants.RELATE_ENTITIES_SUCCESS, payload: this.newRelationship, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IRelationshipErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: relationshipConstants.RELATE_ENTITIES_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IRelationshipErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to relate two entities via the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: relationshipConstants.RELATE_ENTITIES_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public deleteEntity(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/delete?leftId=${this.deleteRelationship?.leftId}&rightId=${this.deleteRelationship?.rightId}&join=${this.deleteRelationship?.join}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: relationshipConstants.UNRELATE_ENTITIES, payload: this.deleteRelationship, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: relationshipConstants.UNRELATE_ENTITIES_SUCCESS, payload: this.deleteRelationship, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IRelationshipErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: relationshipConstants.UNRELATE_ENTITIES_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IRelationshipErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to delete the specified prompt record from the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: relationshipConstants.UNRELATE_ENTITIES_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }
}

export const relate = (authUser: IAuthenticatedUser, newRelationship: INewRelationship, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new RelationshipActionMemento(newRelationship, null, relationshipConstants.RELATE_ENTITIES, timestamp);
    memento.relate(authUser, suppressTimeoutAlert);
};

export const deleteEntity = (authUser: IAuthenticatedUser, deleteRelationship: IDeleteRelationship, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new RelationshipActionMemento(null, deleteRelationship, relationshipConstants.UNRELATE_ENTITIES, timestamp);
    memento.deleteEntity(authUser, suppressTimeoutAlert);
};

