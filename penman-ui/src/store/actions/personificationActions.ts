import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, offlineConstants, personificationConstants } from '../../constants';
import { IReplayableAction, Personification, IReplayUser, IError, ErrorCodes, IClientPersonification, IPersonificationCollection, nullError } from '../types';

export class PersonificationActionMemento implements IReplayableAction {
    public personification: Personification;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string;
    public serializedData: string;

    constructor(personification: Personification, type: string, timestamp: number, lastReadAllISOString = '') {
        this.personification = personification;
        this.type = type;
        this.timestamp = timestamp;
        this.lastReadAllISOString = lastReadAllISOString;
        this.serializedData = PersonificationActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'personification') return Personification.fromSerializedJSON(value);
            else return value;
        });
        return new PersonificationActionMemento(restoredMemento.personification, restoredMemento.type, restoredMemento.timestamp, restoredMemento.lastReadAllISOString);
    }

    static dehydrate(actionMemento: PersonificationActionMemento) {
        const serializedMemento = JSON.stringify({
            personification: actionMemento.personification.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAllISOString: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user: IReplayUser, isOffline: boolean) {
        switch (this.type) {
            case personificationConstants.CREATE_NEW_PERSONIFICATION:
                this.create(user, isOffline, true);
                break;
            case personificationConstants.UPDATE_PERSONIFICATION:
                this.update(user, isOffline, true);
                break;
            case personificationConstants.DELETE_PERSONIFICATION:
                this.deleteEntity(user, isOffline, true);
                break;
            case personificationConstants.READ_PERSONIFICATION:
                this.read(user, isOffline, true);
                break;
            case personificationConstants.READ_ALL_PERSONIFICATIONS:
                this.readAll(user, isOffline, true);
                break;
            default:
                break;
        }
    }

    public create(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/create`;
        const data = this.personification.toCreateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.post(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientPersonification>) => {
            this.personification.onApiProcessed(response.data, true);
            dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_SUCCESS, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else if (err.response && err.response.data && err.response.data.errorCode === ErrorCodes.clientIdCollided) {
                this.personification.handleIdCollision();
                this.create(user, isOffline);
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the new personification: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public update(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/update`;
        const data = this.personification.toUpdateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.patch(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientPersonification>) => {
            this.personification.onApiProcessed(response.data, true);
            dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_SUCCESS, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the specified personification: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public deleteEntity(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/delete?userId=${user.userId}&personificationId=${this.personification.personificationId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.DELETE_PERSONIFICATION, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to delete the specified personification: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public read(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/read?personificationId=${this.personification.personificationId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.READ_PERSONIFICATION, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: personificationConstants.READ_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IClientPersonification>) => {
            this.personification.onApiProcessed(response.data);
            dispatch({ type: personificationConstants.READ_PERSONIFICATION_SUCCESS, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: personificationConstants.READ_PERSONIFICATION_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve the specified personification: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: personificationConstants.READ_PERSONIFICATION_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public readAll(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.personificationsController}/readall?userId=${this.personification.userId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS, payload: this.personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IPersonificationCollection>) => {
            const lastReadAll = new Date(response.data.lastReadAll);
            const personificationCollection = response.data.personifications;
            personificationCollection.forEach((personificationDto) => {
                const personification = new Personification(personificationDto);
                dispatch({ type: personificationConstants.READ_PERSONIFICATION_SUCCESS, payload: personification, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            });
            dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_SUCCESS, payload: { targetUserId: this.personification.userId, lastReadAll }, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve all personifications for the specified book: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        })
    }
}

export const create = (user: IReplayUser, newPersonification: Personification, isOffline = false) => {
    const timestamp = Date.now();
    newPersonification.personificationId = -timestamp;
    const memento = new PersonificationActionMemento(newPersonification, personificationConstants.CREATE_NEW_PERSONIFICATION, timestamp);
    memento.create(user, isOffline);
};

export const update = (user: IReplayUser, personification: Personification, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new PersonificationActionMemento(personification, personificationConstants.UPDATE_PERSONIFICATION, timestamp);
    memento.update(user, isOffline);
};

export const deleteEntity = (user: IReplayUser, personification: Personification, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new PersonificationActionMemento(personification, personificationConstants.DELETE_PERSONIFICATION, timestamp);
    memento.deleteEntity(user, isOffline);
};

export const read = (user: IReplayUser, personificationId: number, isOffline = false) => {
    const timestamp = Date.now();
    const personification = new Personification();
    personification.personificationId = personificationId;
    const memento = new PersonificationActionMemento(personification, personificationConstants.READ_PERSONIFICATION, timestamp);
    memento.read(user, isOffline);
};

export const readAll = (user: IReplayUser, targetUserId: number, lastReadAll: Date, isOffline = false) => {
    const timestamp = Date.now();
    const dummyPersonification = new Personification();
    dummyPersonification.userId = targetUserId;
    const memento = new PersonificationActionMemento(dummyPersonification, personificationConstants.READ_ALL_PERSONIFICATIONS, timestamp, lastReadAll.toISOString());
    memento.readAll(user, isOffline);
};
