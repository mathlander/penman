import axios, { AxiosRequestConfig } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, personificationConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IPersonification, Personification, IPersonificationErrorState, IReplayableAction, restoreOfflineWorkItemFromJSON } from '../types';

export class PersonificationActionMemento implements IReplayableAction {
    public personification: Personification;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string = '';
    public serializedData: string;

    constructor(personification: Personification, type: string, timestamp: number) {
        this.personification = personification;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = PersonificationActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'personification') return restoreOfflineWorkItemFromJSON<Personification>(value, Personification);
            else return value;
        });
        const personificationMemento = new PersonificationActionMemento(restoredMemento.personification, restoredMemento.type, restoredMemento.timestamp);
        personificationMemento.lastReadAllISOString = restoredMemento.lastReadAllISOString || '';
        personificationMemento.serializedData = memento;
        return personificationMemento;
    }

    static dehydrate(actionMemento: PersonificationActionMemento) {
        const serializedMemento = JSON.stringify({
            personification: actionMemento.personification.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAll: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user:IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        switch(this.type) {
            case personificationConstants.CREATE_NEW_PERSONIFICATION:
                this.create(user, suppressTimeoutAlert);
                break;
            case personificationConstants.UPDATE_PERSONIFICATION:
                this.update(user, suppressTimeoutAlert);
                break;
            case personificationConstants.DELETE_PERSONIFICATION:
                this.deleteEntity(user, suppressTimeoutAlert);
                break;
            case personificationConstants.READ_PERSONIFICATION:
                this.read(user, suppressTimeoutAlert);
                break;
            case personificationConstants.READ_ALL_PERSONIFICATIONS:
                this.readAll(user, suppressTimeoutAlert);
                break;
            default:
                break;
        }
    }

    public create(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/create`;
        const data = {
            ...this.personification,
            birthday: this.personification.birthday.toISOString(),
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            this.personification.onApiProcessed(response.data);
            dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_SUCCESS, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPersonificationErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPersonificationErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to register the new personification record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public update(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/update`;
        const data = {
            ...this.personification,
            birthday: this.personification.birthday.toISOString(),
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.patch(
            url,
            data,
            config
        ).then((response) => {
            this.personification.onApiProcessed(response.data);
            dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_SUCCESS, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPersonificationErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPersonificationErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to update the specified personification record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public deleteEntity(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/delete?authorId=${user.authorId}&personificationId=${this.personification.personificationId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.DELETE_PERSONIFICATION, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPersonificationErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPersonificationErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to delete the specified personification record from the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public read(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/read?personificationId=${this.personification.personificationId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.READ_PERSONIFICATION, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const personification = new Personification(response.data);
            dispatch({ type: personificationConstants.READ_PERSONIFICATION_SUCCESS, payload: personification, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPersonificationErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: personificationConstants.READ_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPersonificationErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all personification records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: personificationConstants.READ_PERSONIFICATION_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public readAll(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/readall?authorId=${user.authorId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const personificationCollection: IPersonification[] = response.data.personifications;
            const personifications: Personification[] = [];
            personificationCollection.forEach((personificationDto, idx) => {
                const personification = new Personification(personificationDto);
                personifications.push(personification);
            });
            dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_SUCCESS, payload: personifications, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPersonificationErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPersonificationErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all personification records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }
}

export const create = (authUser: IAuthenticatedUser, newPersonification: Personification, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    newPersonification.personificationId = -timestamp;
    const memento = new PersonificationActionMemento(newPersonification, personificationConstants.CREATE_NEW_PERSONIFICATION, timestamp);
    memento.create(authUser, suppressTimeoutAlert);
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const dummyPersonification = new Personification();
    const memento = new PersonificationActionMemento(dummyPersonification, personificationConstants.READ_ALL_PERSONIFICATIONS, timestamp);
    memento.lastReadAllISOString = lastReadAll.toISOString();
    memento.serializedData = PersonificationActionMemento.dehydrate(memento);
    memento.readAll(authUser, suppressTimeoutAlert);
};

export const read = (authUser: IAuthenticatedUser, personificationId: number, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const personification = new Personification();
    personification.personificationId = personificationId;
    const memento = new PersonificationActionMemento(personification, personificationConstants.READ_PERSONIFICATION, timestamp);
    memento.read(authUser, suppressTimeoutAlert);
};

export const update = (authUser: IAuthenticatedUser, personification: Personification, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new PersonificationActionMemento(personification, personificationConstants.UPDATE_PERSONIFICATION, timestamp);
    memento.update(authUser, suppressTimeoutAlert);
};

export const deleteEntity = (authUser: IAuthenticatedUser, personification: Personification, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new PersonificationActionMemento(personification, personificationConstants.DELETE_PERSONIFICATION, timestamp);
    memento.deleteEntity(authUser, suppressTimeoutAlert);
};

