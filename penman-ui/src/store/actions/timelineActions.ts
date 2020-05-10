import axios, { AxiosRequestConfig } from 'axios';
import { apiConstants, timelineConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, ITimeline, ITimelineCollection, ITimelineErrorState, INewTimeline } from '../types';

export const create = (authUser: IAuthenticatedUser, newTimeline: INewTimeline, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.timelinesController}/create`;
            const data = {
                ...newTimeline,
                eventStart: newTimeline.eventStart.toISOString(),
                eventEnd: newTimeline.eventEnd.toISOString(),
            };
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE, payload: newTimeline, timestamp, suppressTimeoutAlert, memento });
            axios.post(
                url,
                data,
                config
            ).then((response) => {
                const timelineResponseDto: ITimeline = response.data;
                timelineResponseDto.eventStart = new Date(response.data.eventStart);
                timelineResponseDto.eventEnd = new Date(response.data.eventEnd);
                timelineResponseDto.createdDate = new Date(response.data.createdDate);
                timelineResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE_SUCCESS, payload: timelineResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: ITimelineErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: ITimelineErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to register the new timeline record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE_ERROR, error, timestamp, suppressTimeoutAlert });
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
            const url = `${apiConstants.timelinesController}/readall?authorId=${authUser.authorId}&lastReadAll=${lastReadAll.toISOString()}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: timelineConstants.READ_ALL_TIMELINES, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readAllResponseDto: ITimelineCollection = response.data;
                readAllResponseDto.timelines.forEach((timeline, idx) => {
                    timeline.eventStart = new Date(response.data.timelines[idx].eventStart);
                    timeline.eventEnd = new Date(response.data.timelines[idx].eventEnd);
                    timeline.createdDate = new Date(response.data.timelines[idx].createdDate);
                    timeline.modifiedDate = new Date(response.data.timelines[idx].modifiedDate);
                });
                dispatch({ type: timelineConstants.READ_ALL_TIMELINES_SUCCESS, payload: readAllResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: ITimelineErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: timelineConstants.READ_ALL_TIMELINES_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: ITimelineErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all timeline records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: timelineConstants.READ_ALL_TIMELINES_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const read = (authUser: IAuthenticatedUser, timelineId: number, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.timelinesController}/read?timelineId=${timelineId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: timelineConstants.READ_TIMELINE, timestamp, suppressTimeoutAlert, memento });
            axios.get(
                url,
                config
            ).then((response) => {
                const readResponseDto: ITimeline = response.data;
                readResponseDto.eventStart = new Date(response.data.eventStart);
                readResponseDto.eventEnd = new Date(response.data.eventEnd);
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: readResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: ITimelineErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: timelineConstants.READ_TIMELINE_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: ITimelineErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to retrieve all timeline records with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: timelineConstants.READ_TIMELINE_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const update = (authUser: IAuthenticatedUser, timeline: ITimeline, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.timelinesController}/update`;
            const data = {
                ...timeline,
                eventStart: timeline.eventStart.toISOString(),
                eventEnd: timeline.eventEnd.toISOString(),
            };
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: timelineConstants.UPDATE_TIMELINE, payload: timeline, timestamp, suppressTimeoutAlert, memento });
            axios.patch(
                url,
                data,
                config
            ).then((response) => {
                const updateResponseDto: ITimeline = response.data;
                updateResponseDto.eventStart = new Date(response.data.eventStart);
                updateResponseDto.eventEnd = new Date(response.data.eventEnd);
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: timelineConstants.UPDATE_TIMELINE_SUCCESS, payload: updateResponseDto, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: ITimelineErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: timelineConstants.UPDATE_TIMELINE_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: ITimelineErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to update the specified timeline record with the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: timelineConstants.UPDATE_TIMELINE_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, timeline: ITimeline, suppressTimeoutAlert = false) => {
    return (dispatch: any) => {
        const timestamp = Date.now();
        const memento = (user: IAuthenticatedUser, suppressTimeoutAlert: boolean) => {
            const url = `${apiConstants.timelinesController}/delete?authorId=${authUser.authorId}&timelineId=${timeline.timelineId}`;
            const config: AxiosRequestConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                timeout: apiConstants.timeout,
            };
            dispatch({ type: timelineConstants.DELETE_TIMELINE, payload: timeline, timestamp, suppressTimeoutAlert, memento });
            axios.delete(
                url,
                config
            ).then(() => {
                dispatch({ type: timelineConstants.DELETE_TIMELINE_SUCCESS, timestamp, suppressTimeoutAlert });
            }).catch((err) => {
                if (err.code === 'ECONNABORTED' || err.response === undefined) {
                    // timed out or the API wasn't running
                    const error: ITimelineErrorState =  {
                        internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                        displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    };
                    dispatch({ type: timelineConstants.DELETE_TIMELINE_TIMEOUT, error, timestamp, suppressTimeoutAlert });
                    dispatch({ type: offlineConstants.GO_OFFLINE, timestamp, suppressTimeoutAlert });
                } else {
                    // api returned a response... should only happen if refresh token somehow fails to process
                    const error: ITimelineErrorState = err.response.data || {
                        internalErrorMessage: `Received the following error while attempting to delete the specified timeline record from the API: ${err}`,
                        displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                    };
                    dispatch({ type: timelineConstants.DELETE_TIMELINE_ERROR, error, timestamp, suppressTimeoutAlert });
                }
            });
        };
        memento(authUser, suppressTimeoutAlert);
    };
};

