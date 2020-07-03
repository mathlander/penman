import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, authConstants, offlineConstants, promptConstants } from '../../constants';
import { IReplayableAction, IReplayUser } from '../type-defs/offline-types';
import { IError, ErrorCodes, nullError } from '../type-defs/error-types';
import { IStorageManager, PersistenceTypes, StorageRecordType } from '../type-defs/storage-types';
import { IAuthDto, IAuthenticatedUser, IUpdatePasswordDto, AuthenticatedUser } from '../type-defs/auth-types';
import { IPrompt, Prompt, IPromptCollection } from '../type-defs/prompt-types';
import { IUserProfile } from '../type-defs/user-types';

export class PromptActionMemento implements IReplayableAction {
    private _storageManager: IStorageManager;
    public prompt: Prompt;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string;
    public serializedData: string;

    constructor(storageManager: IStorageManager, prompt: Prompt, type: string, timestamp: number, lastReadAllISOString = '') {
        this._storageManager = storageManager;
        this.prompt = prompt;
        this.type = type;
        this.timestamp = timestamp;
        this.lastReadAllISOString = lastReadAllISOString;
        this.serializedData = PromptActionMemento.dehydrate(this);
    }

    static hydrate(storageManager: IStorageManager, memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'prompt') return Prompt.fromSerializedJSON(storageManager, value);
            else return value;
        });
        return new PromptActionMemento(storageManager, restoredMemento.prompt, restoredMemento.type, restoredMemento.timestamp, restoredMemento.lastReadAllISOString);
    }

    static dehydrate(actionMemento: PromptActionMemento) {
        const serializedMemento = JSON.stringify({
            prompt: actionMemento.prompt.serialize(PersistenceTypes.light),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAllISOString: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user: IReplayUser, isOffline: boolean) {
        switch (this.type) {
            case promptConstants.CREATE_NEW_PROMPT:
                this.create(user, isOffline, true);
                break;
            case promptConstants.UPDATE_PROMPT:
                this.update(user, isOffline, true);
                break;
            case promptConstants.DELETE_PROMPT:
                this.deleteEntity(user, isOffline, true);
                break;
            case promptConstants.READ_PROMPT:
                this.read(user, isOffline, true);
                break;
            case promptConstants.READ_ALL_PROMPTS:
                this.readAll(user, isOffline, true);
                break;
            default:
                break;
        }
    }

    public create(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/create`;
        const data = this.prompt.toCreateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.CREATE_NEW_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: promptConstants.CREATE_NEW_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.post(
            url,
            data,
            config
        ).then((response: AxiosResponse<IPrompt>) => {
            this.prompt.onApiProcessed(response.data, true);
            dispatch({ type: promptConstants.CREATE_NEW_PROMPT_SUCCESS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else if (err.response && err.response.data && err.response.data.errorCode === ErrorCodes.clientIdCollided) {
                this.prompt.handleIdCollision();
                this.serializedData = PromptActionMemento.dehydrate(this);
                this.create(user, isOffline);
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the new prompt: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public update(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/update`;
        const data = this.prompt.toUpdateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.UPDATE_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: promptConstants.UPDATE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.patch(
            url,
            data,
            config
        ).then((response: AxiosResponse<IPrompt>) => {
            this.prompt.onApiProcessed(response.data, true);
            dispatch({ type: promptConstants.UPDATE_PROMPT_SUCCESS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: promptConstants.UPDATE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the specified prompt: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: promptConstants.UPDATE_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public deleteEntity(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/delete?userId=${user.userId}&promptId=${this.prompt.promptId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.DELETE_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: promptConstants.DELETE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: promptConstants.DELETE_PROMPT_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: promptConstants.DELETE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to delete the specified prompt: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: promptConstants.DELETE_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public read(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/read?promptId=${this.prompt.promptId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.READ_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: promptConstants.READ_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IPrompt>) => {
            this.prompt.onApiProcessed(response.data);
            dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: promptConstants.READ_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve the specified prompt: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: promptConstants.READ_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public readAll(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/readAll?userId=${this.prompt.userId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.READ_ALL_PROMPTS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: promptConstants.READ_ALL_PROMPTS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IPromptCollection>) => {
            const lastReadAllDate = new Date(response.data.lastReadAllDate);
            const promptCollection = response.data.prompts;
            promptCollection.forEach((promptDto: IPrompt) => {
                const prompt = new Prompt(this._storageManager, promptDto);
                dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            });
            dispatch({ type: promptConstants.READ_ALL_PROMPTS_SUCCESS, payload: { targetUserId: this.prompt.userId, lastReadAllDate }, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve all prompts for the specified book: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }
}

export const create = (storageManager: IStorageManager, user: IReplayUser, newPrompt: Prompt, isOffline = false) => {
    const timestamp = Date.now();
    newPrompt.promptId = -timestamp;
    const memento = new PromptActionMemento(storageManager, newPrompt, promptConstants.CREATE_NEW_PROMPT, timestamp);
    memento.create(user, isOffline);
};

export const update = (storageManager: IStorageManager, user: IReplayUser, prompt: Prompt, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new PromptActionMemento(storageManager, prompt, promptConstants.UPDATE_PROMPT, timestamp);
    memento.update(user, isOffline);
};

export const deleteEntity = (storageManager: IStorageManager, user: IReplayUser, prompt: Prompt, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new PromptActionMemento(storageManager, prompt, promptConstants.DELETE_PROMPT, timestamp);
    memento.deleteEntity(user, isOffline);
};

export const read = (storageManager: IStorageManager, user: IReplayUser, promptId: number, isOffline = false) => {
    const timestamp = Date.now();
    const prompt = new Prompt(storageManager, { promptId });
    const memento = new PromptActionMemento(storageManager, prompt, promptConstants.READ_PROMPT, timestamp);
    memento.read(user, isOffline);
};

export const readAll = (storageManager: IStorageManager, user: IReplayUser, targetUserId: number, lastReadAllDate: Date, isOffline = false) => {
    const timestamp = Date.now();
    const dummyPrompt = new Prompt(storageManager, { userId: targetUserId });
    const memento = new PromptActionMemento(storageManager, dummyPrompt, promptConstants.READ_ALL_PROMPTS_TIMEOUT, timestamp, lastReadAllDate.toISOString());
    memento.readAll(user, isOffline);
};
