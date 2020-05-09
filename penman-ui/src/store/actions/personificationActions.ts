import axios, { AxiosRequestConfig } from 'axios';
import { apiConstants, personificationConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IPersonification, IPersonificationCollection, IPersonificationErrorState, INewPersonification } from '../types';

export const create = (authUser: IAuthenticatedUser, newPersonification: INewPersonification, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/create`;
        const data = {
            ...newPersonification,
            birthday: newPersonification.birthday.toISOString(),
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION, payload: newPersonification, timestamp, suppressTimeoutAlert, memento });
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const personificationResponseDto: IPersonification = response.data;
                personificationResponseDto.birthday = new Date(response.data.birthday);
                personificationResponseDto.createdDate = new Date(response.data.createdDate);
                personificationResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_SUCCESS, payload: personificationResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPersonificationErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPersonificationErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to register the new personification record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/readall?authorId=${authUser.authorId}&lastReadAll=${lastReadAll.toISOString()}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readAllResponseDto: IPersonificationCollection = response.data;
                readAllResponseDto.personifications.forEach((personification, idx) => {
                    personification.birthday = new Date(response.data.personifications[idx].birthday);
                    personification.createdDate = new Date(response.data.personifications[idx].createdDate);
                    personification.modifiedDate = new Date(response.data.personifications[idx].modifiedDate);
                });
                dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_SUCCESS, payload: readAllResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPersonificationErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPersonificationErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all personification records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

export const read = (authUser: IAuthenticatedUser, personificationId: number, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/read?personificationId=${personificationId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: personificationConstants.READ_PERSONIFICATION, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readResponseDto: IPersonification = response.data;
                readResponseDto.birthday = new Date(response.data.birthday);
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: personificationConstants.READ_PERSONIFICATION_SUCCESS, payload: readResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPersonificationErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: personificationConstants.READ_PERSONIFICATION_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPersonificationErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all personification records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: personificationConstants.READ_PERSONIFICATION_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

export const update = (authUser: IAuthenticatedUser, personification: IPersonification, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/update`;
        const data = {
            ...personification,
            birthday: personification.birthday.toISOString(),
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION, payload: personification, timestamp, suppressTimeoutAlert, memento });
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                const updateResponseDto: IPersonification = response.data;
                updateResponseDto.birthday = new Date(response.data.birthday);
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_SUCCESS, payload: updateResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPersonificationErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPersonificationErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to update the specified personification record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, personification: IPersonification, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/delete?authorId=${authUser.authorId}&personificationId=${personification.personificationId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authUser.token}`,
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        const memento = (suppressTimeoutAlert: boolean) => {
            dispatch({ type: personificationConstants.DELETE_PERSONIFICATION, payload: personification, timestamp, suppressTimeoutAlert, memento });
            axios.delete(
                url,
                config
            ).then(() => {
                dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_SUCCESS, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IPersonificationErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IPersonificationErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to delete the specified personification record from the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(suppressTimeoutAlert);
    };
};

