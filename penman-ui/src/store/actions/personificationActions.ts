import axios from 'axios';
import { apiConstants, personificationConstants } from '../../config/constants';
import { IAuthenticatedUser, IPersonification, IPersonificationCollection, IPersonificationErrorState, INewPersonification } from '../types';

export const create = (authUser: IAuthenticatedUser, newPersonification: INewPersonification) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/create`;
        const data = {
            ...newPersonification,
            birthday: newPersonification.birthday.toISOString(),
        };
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
                const personificationResponseDto: IPersonification = response.data;
                personificationResponseDto.birthday = new Date(response.data.birthday);
                personificationResponseDto.createdDate = new Date(response.data.createdDate);
                personificationResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_SUCCESS, payload: personificationResponseDto, timestamp });
            }).catch((err) => {
                const error: IPersonificationErrorState = {
                    internalErrorMessage: `Received the following error while attempting to register the new personification record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION_ERROR, error, timestamp });
            });
        };
        dispatch({ type: personificationConstants.CREATE_NEW_PERSONIFICATION, payload: newPersonification, timestamp, memento });
        memento();
    };
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/readall?authorId=${authUser.authorId}&lastReadAll=${lastReadAll.toISOString()}`;
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
                const readAllResponseDto: IPersonificationCollection = response.data;
                readAllResponseDto.personifications.forEach((personification, idx) => {
                    personification.birthday = new Date(response.data.personifications[idx].birthday);
                    personification.createdDate = new Date(response.data.personifications[idx].createdDate);
                    personification.modifiedDate = new Date(response.data.personifications[idx].modifiedDate);
                });
                dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_SUCCESS, payload: readAllResponseDto, timestamp });
            }).catch((err) => {
                const error: IPersonificationErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all personification records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS, timestamp, memento });
        memento();
    };
};

export const read = (authUser: IAuthenticatedUser, personificationId: number) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/read?personificationId=${personificationId}`;
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
                const readResponseDto: IPersonification = response.data;
                readResponseDto.birthday = new Date(response.data.birthday);
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: personificationConstants.READ_PERSONIFICATION_SUCCESS, payload: readResponseDto, timestamp });
            }).catch((err) => {
                const error: IPersonificationErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all personification records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS_ERROR, error, timestamp });
            });
        };
        dispatch({ type: personificationConstants.READ_ALL_PERSONIFICATIONS, timestamp, memento });
        memento();
    };
};

export const update = (authUser: IAuthenticatedUser, personification: IPersonification) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/update`;
        const data = {
            ...personification,
            birthday: personification.birthday.toISOString(),
        };
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
                const updateResponseDto: IPersonification = response.data;
                updateResponseDto.birthday = new Date(response.data.birthday);
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_SUCCESS, payload: updateResponseDto, timestamp });
            }).catch((err) => {
                const error: IPersonificationErrorState = {
                    internalErrorMessage: `Received the following error while attempting to update the specified personification record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION_ERROR, error, timestamp });
            });
        };
        dispatch({ type: personificationConstants.UPDATE_PERSONIFICATION, payload: personification, timestamp, memento });
        memento();
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, personification: IPersonification) => {
    return (dispatch: any) => {
        const url = `${apiConstants.personificationsController}/delete?authorId=${authUser.authorId}&personificationId=${personification.personificationId}`;
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
                dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_SUCCESS, timestamp });
            }).catch((err) => {
                const error: IPersonificationErrorState = {
                    internalErrorMessage: `Received the following error while attempting to delete the specified personification record from the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: personificationConstants.DELETE_PERSONIFICATION_ERROR, error, timestamp });
            });
        };
        dispatch({ type: personificationConstants.DELETE_PERSONIFICATION, payload: personification, timestamp, memento });
        memento();
    };
};

