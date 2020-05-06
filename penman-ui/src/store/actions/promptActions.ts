import axios from 'axios';
import { apiConstants, promptConstants } from '../../config/constants';
import { IAuthenticatedUser, IPrompt, IPromptCollection, IPromptErrorState, INewPrompt } from '../types';

export const create = (authUser: IAuthenticatedUser, newPrompt: INewPrompt) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/create`;
        const data = newPrompt;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const promptResponseDto: IPrompt = response.data;
                promptResponseDto.createdDate = new Date(response.data.createdDate);
                promptResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_SUCCESS, payload: promptResponseDto, timestamp });
            }).catch((err) => {
                const error: IPromptErrorState = {
                    internalErrorMessage: `Received the following error while attempting to register the new prompt record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: promptConstants.CREATE_NEW_PROMPT_ERROR, error, timestamp });
            });
        };
        dispatch({ type: promptConstants.CREATE_NEW_PROMPT, payload: newPrompt, timestamp, memento });
        memento();
    };
};

export const readAll = (authUser: IAuthenticatedUser) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/readall?authorId=${authUser.authorId}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.get(
                url,
                config
            ).then((response) => {
                const readAllResponseDto: IPromptCollection = response.data;
                readAllResponseDto.prompts.forEach((prompt, idx) => {
                    prompt.createdDate = new Date(response.data.prompts[idx].createdDate);
                    prompt.modifiedDate = new Date(response.data.prompts[idx].modifiedDate);
                });
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_SUCCESS, payload: readAllResponseDto, timestamp });
            }).catch((err) => {
                const error: IPromptErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all prompt records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: promptConstants.READ_ALL_PROMPTS, timestamp, memento });
        memento();
    };
};

export const read = (authUser: IAuthenticatedUser, promptId: number) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/read?promptId=${promptId}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.get(
                url,
                config
            ).then((response) => {
                const readResponseDto: IPrompt = response.data;
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: promptConstants.READ_PROMPT_SUCCESS, payload: readResponseDto, timestamp });
            }).catch((err) => {
                const error: IPromptErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all prompt records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: promptConstants.READ_ALL_PROMPTS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: promptConstants.READ_ALL_PROMPTS, timestamp, memento });
        memento();
    };
};

export const update = (authUser: IAuthenticatedUser, prompt: IPrompt) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/update`;
        const data = prompt;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                const updateResponseDto: IPrompt = response.data;
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: promptConstants.UPDATE_PROMPT_SUCCESS, payload: updateResponseDto, timestamp });
            }).catch((err) => {
                const error: IPromptErrorState = {
                    internalErrorMessage: `Received the following error while attempting to update the specified prompt record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: promptConstants.UPDATE_PROMPT_ERROR, error, timestamp });
            });
        };
        dispatch({ type: promptConstants.UPDATE_PROMPT, timestamp, memento });
        memento();
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, prompt: IPrompt) => {
    return (dispatch: any) => {
        const url = `${apiConstants.promptsController}/delete?authorId=${authUser.authorId}&promptId=${prompt.promptId}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            }
        };
        const timestamp = Date.now();
        const memento = () => {
            axios.delete(
                url,
                config
            ).then(() => {
                dispatch({ type: promptConstants.DELETE_PROMPT_SUCCESS, timestamp });
            }).catch((err) => {
                const error: IPromptErrorState = {
                    internalErrorMessage: `Received the following error while attempting to delete the specified prompt record from the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: promptConstants.DELETE_PROMPT_ERROR, error, timestamp });
            });
        };
        dispatch({ type: promptConstants.DELETE_PROMPT, timestamp, memento });
        memento();
    };
};

