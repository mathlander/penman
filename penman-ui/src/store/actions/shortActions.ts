import axios, { AxiosRequestConfig } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, shortConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IShort, Short, IShortErrorState, IReplayableAction, restoreOfflineWorkItemFromJSON } from '../types';

export class ShortActionMemento implements IReplayableAction {
    public short: Short;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string = '';
    public serializedData: string;

    constructor(short: Short, type: string, timestamp: number) {
        this.short = short;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = ShortActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'short') return restoreOfflineWorkItemFromJSON<Short>(value, Short);
            else return value;
        });
        const shortMemento = new ShortActionMemento(restoredMemento.short, restoredMemento.type, restoredMemento.timestamp);
        shortMemento.lastReadAllISOString = restoredMemento.lastReadAllISOString || '';
        shortMemento.serializedData = memento;
        return shortMemento;
    }

    static dehydrate(actionMemento: ShortActionMemento) {
        const serializedMemento = JSON.stringify({
            short: actionMemento.short.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAll: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user:IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        switch(this.type) {
            case shortConstants.CREATE_NEW_SHORT:
                this.create(user, suppressTimeoutAlert);
                break;
            case shortConstants.UPDATE_SHORT:
                this.update(user, suppressTimeoutAlert);
                break;
            case shortConstants.DELETE_SHORT:
                this.deleteEntity(user, suppressTimeoutAlert);
                break;
            case shortConstants.READ_SHORT:
                this.read(user, suppressTimeoutAlert);
                break;
            case shortConstants.READ_ALL_SHORTS:
                this.readAll(user, suppressTimeoutAlert);
                break;
            default:
                break;
        }
    }

    public create(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.shortsController}/create`;
        const data = {
            ...this.short,
            eventStart: this.short.eventStart.toISOString(),
            eventEnd: this.short.eventEnd.toISOString(),
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: shortConstants.CREATE_NEW_SHORT, payload: this.short, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            this.short.onApiProcessed(response.data);
            dispatch({ type: shortConstants.CREATE_NEW_SHORT_SUCCESS, payload: this.short, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IShortErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: shortConstants.CREATE_NEW_SHORT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IShortErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to register the new short record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: shortConstants.CREATE_NEW_SHORT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public update(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.shortsController}/update`;
        const data = {
            ...this.short,
            eventStart: this.short.eventStart.toISOString(),
            eventEnd: this.short.eventEnd.toISOString(),
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: shortConstants.UPDATE_SHORT, payload: this.short, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.patch(
            url,
            data,
            config
        ).then((response) => {
            this.short.onApiProcessed(response.data);
            dispatch({ type: shortConstants.UPDATE_SHORT_SUCCESS, payload: this.short, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IShortErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: shortConstants.UPDATE_SHORT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IShortErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to update the specified short record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: shortConstants.UPDATE_SHORT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public deleteEntity(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.shortsController}/delete?authorId=${user.authorId}&shortId=${this.short.shortId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: shortConstants.DELETE_SHORT, payload: this.short, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: shortConstants.DELETE_SHORT_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IShortErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: shortConstants.DELETE_SHORT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IShortErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to delete the specified short record from the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: shortConstants.DELETE_SHORT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public read(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.shortsController}/read?shortId=${this.short.shortId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: shortConstants.READ_SHORT, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const short = new Short(response.data);
            dispatch({ type: shortConstants.READ_SHORT_SUCCESS, payload: short, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IShortErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: shortConstants.READ_SHORT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IShortErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all short records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: shortConstants.READ_SHORT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public readAll(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.shortsController}/readall?authorId=${user.authorId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: shortConstants.READ_ALL_SHORTS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const shortCollection: IShort[] = response.data.shorts;
            const shorts: Short[] = [];
            shortCollection.forEach((shortDto, idx) => {
                const short = new Short(shortDto);
                shorts.push(short);
            });
            dispatch({ type: shortConstants.READ_ALL_SHORTS_SUCCESS, payload: shorts, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IShortErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: shortConstants.READ_ALL_SHORTS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IShortErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all short records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: shortConstants.READ_ALL_SHORTS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }
}

export const create = (authUser: IAuthenticatedUser, newShort: Short, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    newShort.shortId = -timestamp;
    const memento = new ShortActionMemento(newShort, shortConstants.CREATE_NEW_SHORT, timestamp);
    memento.create(authUser, suppressTimeoutAlert);
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const dummyShort = new Short();
    const memento = new ShortActionMemento(dummyShort, shortConstants.READ_ALL_SHORTS, timestamp);
    memento.lastReadAllISOString = lastReadAll.toISOString();
    memento.serializedData = ShortActionMemento.dehydrate(memento);
    memento.readAll(authUser, suppressTimeoutAlert);
};

export const read = (authUser: IAuthenticatedUser, shortId: number, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const short = new Short();
    short.shortId = shortId;
    const memento = new ShortActionMemento(short, shortConstants.READ_SHORT, timestamp);
    memento.read(authUser, suppressTimeoutAlert);
};

export const update = (authUser: IAuthenticatedUser, short: Short, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new ShortActionMemento(short, shortConstants.UPDATE_SHORT, timestamp);
    memento.update(authUser, suppressTimeoutAlert);
};

export const deleteEntity = (authUser: IAuthenticatedUser, short: Short, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new ShortActionMemento(short, shortConstants.DELETE_SHORT, timestamp);
    memento.deleteEntity(authUser, suppressTimeoutAlert);
};

