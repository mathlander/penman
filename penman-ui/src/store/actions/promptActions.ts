import axios, { AxiosRequestConfig } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, promptConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IPrompt, Prompt, IPromptErrorState, IReplayableAction, restoreOfflineWorkItemFromJSON } from '../types';

export class PromptActionMemento implements IReplayableAction {
    public prompt: Prompt;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string = '';
    public serializedData: string;

    constructor(prompt: Prompt, type: string, timestamp: number) {
        this.prompt = prompt;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = PromptActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'prompt') return restoreOfflineWorkItemFromJSON<Prompt>(value, Prompt);
            else return value;
        });
        const promptMemento = new PromptActionMemento(restoredMemento.prompt, restoredMemento.type, restoredMemento.timestamp);
        promptMemento.lastReadAllISOString = restoredMemento.lastReadAllISOString || '';
        promptMemento.serializedData = memento;
        return promptMemento;
    }

    static dehydrate(actionMemento: PromptActionMemento) {
        const serializedMemento = JSON.stringify({
            prompt: actionMemento.prompt.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAll: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user:IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        switch(this.type) {
            case promptConstants.CREATE_NEW_PROMPT:
                this.create(user, suppressTimeoutAlert);
                break;
            case promptConstants.UPDATE_PROMPT:
                this.update(user, suppressTimeoutAlert);
                break;
            case promptConstants.DELETE_PROMPT:
                this.deleteEntity(user, suppressTimeoutAlert);
                break;
            case promptConstants.READ_PROMPT:
                this.read(user, suppressTimeoutAlert);
                break;
            case promptConstants.READ_ALL_PROMPTS:
                this.readAll(user, suppressTimeoutAlert);
                break;
            default:
                break;
        }
    }

    public create(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/create`;
        const data = this.prompt;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.CREATE_NEW_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            this.prompt.onApiProcessed(response.data);
            dispatch({ type: promptConstants.CREATE_NEW_PROMPT_SUCCESS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPromptErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPromptErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to register the new prompt record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public update(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/update`;
        const data = prompt;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.UPDATE_PROMPT, payload: prompt, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.patch(
            url,
            data,
            config
        ).then((response) => {
            this.prompt.onApiProcessed(response.data);
            dispatch({ type: promptConstants.UPDATE_PROMPT_SUCCESS, payload: prompt, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPromptErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: promptConstants.UPDATE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPromptErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to update the specified prompt record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: promptConstants.UPDATE_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public deleteEntity(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/delete?authorId=${user.authorId}&promptId=${this.prompt.promptId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.DELETE_PROMPT, payload: prompt, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: promptConstants.DELETE_PROMPT_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPromptErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: promptConstants.DELETE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPromptErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to delete the specified prompt record from the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: promptConstants.DELETE_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public read(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/read?promptId=${this.prompt.promptId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.READ_PROMPT, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const prompt = new Prompt(response.data);
            dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: prompt, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPromptErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: promptConstants.READ_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPromptErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all prompt records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: promptConstants.READ_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public readAll(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.promptsController}/readall?authorId=${user.authorId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: promptConstants.READ_ALL_PROMPTS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const promptCollection: IPrompt[] = response.data.prompts;
            const prompts: Prompt[] = [];
            promptCollection.forEach((promptDto, idx) => {
                const prompt = new Prompt(promptDto);
                prompts.push(prompt);
            });
            dispatch({ type: promptConstants.READ_ALL_PROMPTS_SUCCESS, payload: prompts, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: IPromptErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: IPromptErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all prompt records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }
}

export const create = (authUser: IAuthenticatedUser, newPrompt: Prompt, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    newPrompt.promptId = -timestamp;
    const memento = new PromptActionMemento(newPrompt, promptConstants.CREATE_NEW_PROMPT, timestamp);
    memento.create(authUser, suppressTimeoutAlert);
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const dummyPrompt = new Prompt();
    const memento = new PromptActionMemento(dummyPrompt, promptConstants.READ_ALL_PROMPTS, timestamp);
    memento.lastReadAllISOString = lastReadAll.toISOString();
    memento.serializedData = PromptActionMemento.dehydrate(memento);
    memento.readAll(authUser, suppressTimeoutAlert);
};

export const read = (authUser: IAuthenticatedUser, promptId: number, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const prompt = new Prompt();
    prompt.promptId = promptId;
    const memento = new PromptActionMemento(prompt, promptConstants.READ_PROMPT, timestamp);
    memento.read(authUser, suppressTimeoutAlert);
};

export const update = (authUser: IAuthenticatedUser, prompt: Prompt, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new PromptActionMemento(prompt, promptConstants.UPDATE_PROMPT, timestamp);
    memento.update(authUser, suppressTimeoutAlert);
};

export const deleteEntity = (authUser: IAuthenticatedUser, prompt: Prompt, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new PromptActionMemento(prompt, promptConstants.DELETE_PROMPT, timestamp);
    memento.deleteEntity(authUser, suppressTimeoutAlert);
};

