import axios, { AxiosRequestConfig } from 'axios';
import { apiConstants, promptConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IPrompt, IPromptCollection, IPromptErrorState, INewPrompt } from '../types';

export const create = (authUser: IAuthenticatedUser, newPrompt: INewPrompt, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/create`;
        const data = newPrompt;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: promptConstants.CREATE_NEW_PROMPT, payload: newPrompt, timestamp, suppressTimeoutAlert, memento });
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const promptResponseDto: IPrompt = response.data;
                promptResponseDto.createdDate = new Date(response.data.createdDate);
                promptResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_SUCCESS, payload: promptResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPromptErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: promptConstants.CREATE_NEW_PROMPT_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPromptErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to register the new prompt record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: promptConstants.CREATE_NEW_PROMPT_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/readall?authorId=${authUser.authorId}&lastReadAll=${lastReadAll.toISOString()}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: promptConstants.READ_ALL_PROMPTS, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readAllResponseDto: IPromptCollection = response.data;
                readAllResponseDto.prompts.forEach((prompt, idx) => {
                    prompt.createdDate = new Date(response.data.prompts[idx].createdDate);
                    prompt.modifiedDate = new Date(response.data.prompts[idx].modifiedDate);
                });
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_SUCCESS, payload: readAllResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPromptErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: promptConstants.READ_ALL_PROMPTS_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPromptErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all prompt records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: promptConstants.READ_ALL_PROMPTS_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

export const read = (authUser: IAuthenticatedUser, promptId: number, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/read?promptId=${promptId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: promptConstants.READ_PROMPT, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readResponseDto: IPrompt = response.data;
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: readResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPromptErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: promptConstants.READ_PROMPT_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPromptErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all prompt records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: promptConstants.READ_PROMPT_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

export const update = (authUser: IAuthenticatedUser, prompt: IPrompt, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/update`;
        const data = prompt;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: promptConstants.UPDATE_PROMPT, payload: prompt, timestamp, suppressTimeoutAlert, memento });
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                const updateResponseDto: IPrompt = response.data;
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: promptConstants.UPDATE_PROMPT_SUCCESS, payload: updateResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPromptErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: promptConstants.UPDATE_PROMPT_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPromptErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to update the specified prompt record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: promptConstants.UPDATE_PROMPT_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, prompt: IPrompt, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/delete?authorId=${authUser.authorId}&promptId=${prompt.promptId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: promptConstants.DELETE_PROMPT, payload: prompt, timestamp, suppressTimeoutAlert, memento });
            axios.delete(
                url,
                config
            ).then(() => {
                dispatch({ type: promptConstants.DELETE_PROMPT_SUCCESS, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPromptErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: promptConstants.DELETE_PROMPT_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPromptErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to delete the specified prompt record from the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: promptConstants.DELETE_PROMPT_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

