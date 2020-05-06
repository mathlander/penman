import axios from 'axios';
import { apiConstants, shortConstants } from '../../config/constants';
import { IAuthenticatedUser, IShort, IShortCollection, IShortErrorState, INewShort } from '../types';

export const create = (authUser: IAuthenticatedUser, newShort: INewShort) => {
    return (dispatch: any) => {
        const url = `${apiConstants.shortsController}/create`;
        const data = newShort;
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
                const shortResponseDto: IShort = response.data;
                shortResponseDto.eventStart = new Date(response.data.eventStart);
                shortResponseDto.eventEnd = new Date(response.data.eventEnd);
                shortResponseDto.createdDate = new Date(response.data.createdDate);
                shortResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: shortConstants.CREATE_NEW_SHORT_SUCCESS, payload: shortResponseDto, timestamp });
            }).catch((err) => {
                const error: IShortErrorState = {
                    internalErrorMessage: `Received the following error while attempting to register the new short record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: shortConstants.CREATE_NEW_SHORT_ERROR, error, timestamp });
            });
        };
        dispatch({ type: shortConstants.CREATE_NEW_SHORT, payload: newShort, timestamp, memento });
        memento();
    };
};

export const readAll = (authUser: IAuthenticatedUser) => {
    return (dispatch: any) => {
        const url = `${apiConstants.shortsController}/readall?authorId=${authUser.authorId}`;
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
                const readAllResponseDto: IShortCollection = response.data;
                readAllResponseDto.shorts.forEach((short, idx) => {
                    short.eventStart = new Date(response.data.shorts[idx].eventStart);
                    short.eventEnd = new Date(response.data.shorts[idx].eventEnd);
                    short.createdDate = new Date(response.data.shorts[idx].createdDate);
                    short.modifiedDate = new Date(response.data.shorts[idx].modifiedDate);
                });
                dispatch({ type: shortConstants.READ_ALL_SHORTS_SUCCESS, payload: readAllResponseDto, timestamp });
            }).catch((err) => {
                const error: IShortErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all short records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: shortConstants.READ_ALL_SHORTS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: shortConstants.READ_ALL_SHORTS, timestamp, memento });
        memento();
    };
};

export const read = (authUser: IAuthenticatedUser, shortId: number) => {
    return (dispatch: any) => {
        const url = `${apiConstants.shortsController}/read?shortId=${shortId}`;
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
                const readResponseDto: IShort = response.data;
                readResponseDto.eventStart = new Date(response.data.eventStart);
                readResponseDto.eventEnd = new Date(response.data.eventEnd);
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: shortConstants.READ_SHORT_SUCCESS, payload: readResponseDto, timestamp });
            }).catch((err) => {
                const error: IShortErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all short records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: shortConstants.READ_ALL_SHORTS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: shortConstants.READ_ALL_SHORTS, timestamp, memento });
        memento();
    };
};

export const update = (authUser: IAuthenticatedUser, short: IShort) => {
    return (dispatch: any) => {
        const url = `${apiConstants.shortsController}/update`;
        const data = short;
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
                const updateResponseDto: IShort = response.data;
                updateResponseDto.eventStart = new Date(response.data.eventStart);
                updateResponseDto.eventEnd = new Date(response.data.eventEnd);
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: shortConstants.UPDATE_SHORT_SUCCESS, payload: updateResponseDto, timestamp });
            }).catch((err) => {
                const error: IShortErrorState = {
                    internalErrorMessage: `Received the following error while attempting to update the specified short record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: shortConstants.UPDATE_SHORT_ERROR, error, timestamp });
            });
        };
        dispatch({ type: shortConstants.UPDATE_SHORT, timestamp, memento });
        memento();
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, short: IShort) => {
    return (dispatch: any) => {
        const url = `${apiConstants.shortsController}/delete?authorId=${authUser.authorId}&shortId=${short.shortId}`;
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
                dispatch({ type: shortConstants.DELETE_SHORT_SUCCESS, timestamp });
            }).catch((err) => {
                const error: IShortErrorState = {
                    internalErrorMessage: `Received the following error while attempting to delete the specified short record from the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: shortConstants.DELETE_SHORT_ERROR, error, timestamp });
            });
        };
        dispatch({ type: shortConstants.DELETE_SHORT, timestamp, memento });
        memento();
    };
};

