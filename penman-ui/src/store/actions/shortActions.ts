import axios, { AxiosRequestConfig } from 'axios';
import { apiConstants, shortConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, IShort, IShortCollection, IShortErrorState, INewShort } from '../types';

export const create = (authUser: IAuthenticatedUser, newShort: INewShort, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.shortsController}/create`;
            const data = {
                ...newShort,
                eventStart: newShort.eventStart.toISOString(),
                eventEnd: newShort.eventEnd.toISOString(),
            };
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: shortConstants.CREATE_NEW_SHORT, payload: newShort, timestamp, suppressTimeoutAlert, memento });
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const shortResponseDto: IShort = response.data;
                shortResponseDto.eventStart = new Date(response.data.eventStart);
                shortResponseDto.eventEnd = new Date(response.data.eventEnd);
                shortResponseDto.createdDate = new Date(response.data.createdDate);
                shortResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: shortConstants.CREATE_NEW_SHORT_SUCCESS, payload: shortResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IShortErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: shortConstants.CREATE_NEW_SHORT_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IShortErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to register the new short record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: shortConstants.CREATE_NEW_SHORT_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.shortsController}/readall?authorId=${authUser.authorId}&lastReadAll=${lastReadAll.toISOString()}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: shortConstants.READ_ALL_SHORTS, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readAllResponseDto: IShortCollection = response.data;
                readAllResponseDto.shorts.forEach((short, idx) => {
                    short.eventStart = new Date(response.data.shorts[idx].eventStart);
                    short.eventEnd = new Date(response.data.shorts[idx].eventEnd);
                    short.createdDate = new Date(response.data.shorts[idx].createdDate);
                    short.modifiedDate = new Date(response.data.shorts[idx].modifiedDate);
                });
                dispatch({ type: shortConstants.READ_ALL_SHORTS_SUCCESS, payload: readAllResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IShortErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: shortConstants.READ_ALL_SHORTS_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IShortErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all short records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: shortConstants.READ_ALL_SHORTS_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const read = (authUser: IAuthenticatedUser, shortId: number, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.shortsController}/read?shortId=${shortId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: shortConstants.READ_SHORT, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readResponseDto: IShort = response.data;
                readResponseDto.eventStart = new Date(response.data.eventStart);
                readResponseDto.eventEnd = new Date(response.data.eventEnd);
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: shortConstants.READ_SHORT_SUCCESS, payload: readResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IShortErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: shortConstants.READ_SHORT_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IShortErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all short records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: shortConstants.READ_SHORT_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const update = (authUser: IAuthenticatedUser, short: IShort, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.shortsController}/update`;
            const data = {
                ...short,
                eventStart: short.eventStart.toISOString(),
                eventEnd: short.eventEnd.toISOString(),
            };
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: shortConstants.UPDATE_SHORT, payload: short, timestamp, suppressTimeoutAlert, memento });
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                const updateResponseDto: IShort = response.data;
                updateResponseDto.eventStart = new Date(response.data.eventStart);
                updateResponseDto.eventEnd = new Date(response.data.eventEnd);
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: shortConstants.UPDATE_SHORT_SUCCESS, payload: updateResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IShortErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: shortConstants.UPDATE_SHORT_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IShortErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to update the specified short record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: shortConstants.UPDATE_SHORT_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, short: IShort, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.shortsController}/delete?authorId=${authUser.authorId}&shortId=${short.shortId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: shortConstants.DELETE_SHORT, payload: short, timestamp, suppressTimeoutAlert, memento });
            axios.delete(
                url,
                config
            ).then(() => {
                dispatch({ type: shortConstants.DELETE_SHORT_SUCCESS, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: IShortErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: shortConstants.DELETE_SHORT_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: IShortErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to delete the specified short record from the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: shortConstants.DELETE_SHORT_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

