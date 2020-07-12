import axios from 'axios';
// import { useDispatch } from 'react-redux';
import { apiConstants, promptConstants, offlineConstants } from '../../constants';
import { errorCodes, nullError } from '../types/errorTypes';
import { persistenceTypes } from '../types/storageTypes';
import { Prompt, promptFromSerializedJSON } from '../types/promptTypes';

export const PromptActionMemento = (function() {
    const PromptActionMemento = function(storageManager, prompt, type, timestamp, lastReadAllISOString = '', serializedData = '') {
        this.storageManager = storageManager;
        if (!serializedData) {
            this.prompt = prompt;
            this.type = type;
            this.timestamp = timestamp;
            this.lastReadAllISOString = lastReadAllISOString;
            this.dehydrate();
        } else {
            this.hydrate(serializedData);
        }
    };
    PromptActionMemento.prototype.hydrate = function(memento) {
        this.serializedData = memento;
        const instance = this;
        JSON.parse(memento, (key, value) => {
            if (key === 'prompt') instance.prompt = promptFromSerializedJSON(instance.storageManager, value);
            else if (key === 'type') instance.type = value;
            else if (key === 'timestamp') instance.timestamp = value;
            else if (key === 'lastReadAllISOString') instance.lastReadAllISOString = value;
            return null;
        });
        return this;
    };
    PromptActionMemento.prototype.dehydrate = function() {
        this.serializedData = JSON.stringify({
            prompt: this.prompt.serializeObject(persistenceTypes.light),
            type: this.type,
            timestamp: this.timestamp,
            lastReadAllISOString: this.lastReadAllISOString,
        })
        return this.serializedData;
    };
    PromptActionMemento.prototype.playAction = function(replayUser, isOffline) {
        switch (this.type) {
            case promptConstants.CREATE_NEW_PROMPT:
                return this.create(replayUser, isOffline, true);
            case promptConstants.UPDATE_PROMPT:
                return this.update(replayUser, isOffline, true);
            case promptConstants.DELETE_PROMPT:
                return this.deleteEntity(replayUser, isOffline, true);
            case promptConstants.READ_PROMPT:
                return this.read(replayUser, isOffline, true);
            case promptConstants.READ_ALL_PROMPTS:
                return this.readAll(replayUser, isOffline, true);
            default:
                break;
        }
    };
    PromptActionMemento.prototype.create = function(replayUser, isOffline, force = false) {
        return (dispatch) => {
            // const dispatch = useDispatch();
            const url = `${apiConstants.promptsController}/create`;
            const data = this.prompt.toCreateDto();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${replayUser.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: promptConstants.CREATE_NEW_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            if (isOffline && !force) {
                // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
                const error = Object.assign({}, nullError, { errorCode: errorCodes.apiUnreachable });
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                return;
            }
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                this.prompt.onApiProcessed(response.data, true);
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_SUCCESS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    const error = {
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        errorCode: errorCodes.apiUnreachable,
                    };
                    dispatch({ type: promptConstants.CREATE_NEW_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                } else if (err.response && err.response.data && err.response.data.errorCode === errorCodes.clientIdCollided) {
                    this.prompt.handleIdCollision();
                    this.dehydrate();
                    this.create(replayUser, isOffline);
                } else {
                    const error = Object.assign({
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This action will not be automatically retried.`,
                        internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the new prompt: ${err}`,
                        errorCode: errorCodes.unknown,
                    }, err.response.data);
                    dispatch({ type: promptConstants.CREATE_NEW_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                }
            });
        };
    };
    PromptActionMemento.prototype.update = function(replayUser, isOffline, force = false) {
        return (dispatch) => {
            // const dispatch = useDispatch();
            const url = `${apiConstants.promptsController}/update`;
            const data = this.prompt.toUpdateDto();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${replayUser.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: promptConstants.UPDATE_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            if (isOffline && !force) {
                // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
                const error = Object.assign({}, nullError, { errorCode: errorCodes.apiUnreachable });
                dispatch({ type: promptConstants.UPDATE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                return;
            }
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                this.prompt.onApiProcessed(response.data, true);
                dispatch({ type: promptConstants.UPDATE_PROMPT_SUCCESS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    const error = {
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        errorCode: errorCodes.apiUnreachable,
                    };
                    dispatch({ type: promptConstants.UPDATE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                } else {
                    const error = Object.assign({
                        displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                        internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the specified prompt: ${err}`,
                        errorCode: errorCodes.unknown,
                    }, err.response.data);
                    dispatch({ type: promptConstants.UPDATE_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                }
            });
        };
    };
    PromptActionMemento.prototype.deleteEntity = function(replayUser, isOffline, force = false) {
        return (dispatch) => {
            // const dispatch = useDispatch();
            const url = `${apiConstants.promptsController}/delete?replayUserId=${replayUser.replayUserId}&promptId=${this.prompt.promptId}`;
            const config = {
                headers: {
                    'Authorization': `Bearer ${replayUser.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: promptConstants.DELETE_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            if (isOffline && !force) {
                // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
                const error = Object.assign({}, nullError, { errorCode: errorCodes.apiUnreachable });
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
                    const error = {
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        errorCode: errorCodes.apiUnreachable,
                    };
                    dispatch({ type: promptConstants.DELETE_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                } else {
                    const error = Object.assign({
                        displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                        internalErrorMessage: `Received error code [${err.errorCode}] while attempting to delete the specified prompt: ${err}`,
                        errorCode: errorCodes.unknown,
                    }, err.response.data);
                    dispatch({ type: promptConstants.DELETE_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                }
            });
        };
    };
    PromptActionMemento.prototype.read = function(replayUser, isOffline, force = false) {
        return (dispatch) => {
            // const dispatch = useDispatch();
            const url = `${apiConstants.promptsController}/read?promptId=${this.prompt.promptId}`;
            const config = {
                headers: {
                    'Authorization': `Bearer ${replayUser.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: promptConstants.READ_PROMPT, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            if (isOffline && !force) {
                // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
                const error = Object.assign({}, nullError, { errorCode: errorCodes.apiUnreachable });
                dispatch({ type: promptConstants.READ_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                return;
            }
            axios.get(
                url,
                config
            ).then((response) => {
                this.prompt.onApiProcessed(response.data);
                dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    const error = {
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        errorCode: errorCodes.apiUnreachable,
                    };
                    dispatch({ type: promptConstants.READ_PROMPT_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                } else {
                    const error = Object.assign({
                        displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                        internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve the specified prompt: ${err}`,
                        errorCode: errorCodes.unknown,
                    }, err.response.data);
                    dispatch({ type: promptConstants.READ_PROMPT_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                }
            });
        };
    };
    PromptActionMemento.prototype.readAll = function(replayUser, isOffline, force = false) {
        return (dispatch) => {
            // const dispatch = useDispatch();
            const url = `${apiConstants.promptsController}/readAll?replayUserId=${this.prompt.replayUserId}&lastReadAll=${this.lastReadAllISOString}`;
            const config = {
                headers: {
                    'Authorization': `Bearer ${replayUser.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: promptConstants.READ_ALL_PROMPTS, payload: this.prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            if (isOffline && !force) {
                // avoid foreign key errors by short-circuiting the attempt when offline, unless forced by the OfflineManager
                const error = Object.assign({}, nullError, { errorCode: errorCodes.apiUnreachable });
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                return;
            }
            axios.get(
                url,
                config
            ).then((response) => {
                const lastReadAllDate = new Date(response.data.lastReadAllDate);
                const promptCollection = response.data.prompts;
                promptCollection.forEach((promptDto) => {
                    const prompt = new Prompt(this._storageManager, promptDto);
                    dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: prompt, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                });
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_SUCCESS, payload: { targetUserId: this.prompt.replayUserId, lastReadAllDate }, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    const error = {
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        errorCode: errorCodes.apiUnreachable,
                    };
                    dispatch({ type: promptConstants.READ_ALL_PROMPTS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                } else {
                    const error = Object.assign({
                        displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                        internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve all prompts for the specified book: ${err}`,
                        errorCode: errorCodes.unknown,
                    }, err.response.data);
                    dispatch({ type: promptConstants.READ_ALL_PROMPTS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
                }
            });
        };
    };
    return PromptActionMemento;
})();

export const create = (storageManager, user, newPrompt, isOffline = false) => {
    const timestamp = Date.now();
    newPrompt.promptId = -timestamp;
    const memento = new PromptActionMemento(storageManager, newPrompt, promptConstants.CREATE_NEW_PROMPT, timestamp);
    return memento.create(user, isOffline);
};

export const update = (storageManager, user, prompt, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new PromptActionMemento(storageManager, prompt, promptConstants.UPDATE_PROMPT, timestamp);
    return memento.update(user, isOffline);
};

export const deleteEntity = (storageManager, user, prompt, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new PromptActionMemento(storageManager, prompt, promptConstants.DELETE_PROMPT, timestamp);
    return memento.deleteEntity(user, isOffline);
};

export const read = (storageManager, user, promptId, isOffline = false) => {
    const timestamp = Date.now();
    const prompt = new Prompt(storageManager, { promptId });
    const memento = new PromptActionMemento(storageManager, prompt, promptConstants.READ_PROMPT, timestamp);
    return memento.read(user, isOffline);
};

export const readAll = (storageManager, user, targetUserId, lastReadAllDate, isOffline = false) => {
    const timestamp = Date.now();
    const dummyPrompt = new Prompt(storageManager, { userId: targetUserId });
    const memento = new PromptActionMemento(storageManager, dummyPrompt, promptConstants.READ_ALL_PROMPTS_TIMEOUT, timestamp, lastReadAllDate.toISOString());
    return memento.readAll(user, isOffline);
};
