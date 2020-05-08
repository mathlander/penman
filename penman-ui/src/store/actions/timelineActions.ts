import axios from 'axios';
import { apiConstants, timelineConstants } from '../../config/constants';
import { IAuthenticatedUser, ITimeline, ITimelineCollection, ITimelineErrorState, INewTimeline } from '../types';

export const create = (authUser: IAuthenticatedUser, newTimeline: INewTimeline) => {
    return (dispatch: any) => {
        const url = `${apiConstants.timelinesController}/create`;
        const data = {
            ...newTimeline,
            eventStart: newTimeline.eventStart.toISOString(),
            eventEnd: newTimeline.eventEnd.toISOString(),
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
                const timelineResponseDto: ITimeline = response.data;
                timelineResponseDto.eventStart = new Date(response.data.eventStart);
                timelineResponseDto.eventEnd = new Date(response.data.eventEnd);
                timelineResponseDto.createdDate = new Date(response.data.createdDate);
                timelineResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE_SUCCESS, payload: timelineResponseDto, timestamp });
            }).catch((err) => {
                const error: ITimelineErrorState = {
                    internalErrorMessage: `Received the following error while attempting to register the new timeline record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE_ERROR, error, timestamp });
            });
        };
        dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE, payload: newTimeline, timestamp, memento });
        memento();
    };
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date) => {
    return (dispatch: any) => {
        const url = `${apiConstants.timelinesController}/readall?authorId=${authUser.authorId}&lastReadAll=${lastReadAll.toISOString()}`;
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
                const readAllResponseDto: ITimelineCollection = response.data;
                readAllResponseDto.timelines.forEach((timeline, idx) => {
                    timeline.eventStart = new Date(response.data.timelines[idx].eventStart);
                    timeline.eventEnd = new Date(response.data.timelines[idx].eventEnd);
                    timeline.createdDate = new Date(response.data.timelines[idx].createdDate);
                    timeline.modifiedDate = new Date(response.data.timelines[idx].modifiedDate);
                });
                dispatch({ type: timelineConstants.READ_ALL_TIMELINES_SUCCESS, payload: readAllResponseDto, timestamp });
            }).catch((err) => {
                const error: ITimelineErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all timeline records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: timelineConstants.READ_ALL_TIMELINES_ERROR, error, timestamp });
            });
        };
        dispatch({ type: timelineConstants.READ_ALL_TIMELINES, timestamp, memento });
        memento();
    };
};

export const read = (authUser: IAuthenticatedUser, timelineId: number) => {
    return (dispatch: any) => {
        const url = `${apiConstants.timelinesController}/read?timelineId=${timelineId}`;
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
                const readResponseDto: ITimeline = response.data;
                readResponseDto.eventStart = new Date(response.data.eventStart);
                readResponseDto.eventEnd = new Date(response.data.eventEnd);
                readResponseDto.createdDate = new Date(response.data.createdDate);
                readResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: readResponseDto, timestamp });
            }).catch((err) => {
                const error: ITimelineErrorState = {
                    internalErrorMessage: `Received the following error while attempting to retrieve all timeline records with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: timelineConstants.READ_ALL_TIMELINES_ERROR, error, timestamp });
            });
        };
        dispatch({ type: timelineConstants.READ_ALL_TIMELINES, timestamp, memento });
        memento();
    };
};

export const update = (authUser: IAuthenticatedUser, timeline: ITimeline) => {
    return (dispatch: any) => {
        const url = `${apiConstants.timelinesController}/update`;
        const data = {
            ...timeline,
            eventStart: timeline.eventStart.toISOString(),
            eventEnd: timeline.eventEnd.toISOString(),
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
                const updateResponseDto: ITimeline = response.data;
                updateResponseDto.eventStart = new Date(response.data.eventStart);
                updateResponseDto.eventEnd = new Date(response.data.eventEnd);
                updateResponseDto.createdDate = new Date(response.data.createdDate);
                updateResponseDto.modifiedDate = new Date(response.data.modifiedDate);
                dispatch({ type: timelineConstants.UPDATE_TIMELINE_SUCCESS, payload: updateResponseDto, timestamp });
            }).catch((err) => {
                const error: ITimelineErrorState = {
                    internalErrorMessage: `Received the following error while attempting to update the specified timeline record with the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: timelineConstants.UPDATE_TIMELINE_ERROR, error, timestamp });
            });
        };
        dispatch({ type: timelineConstants.UPDATE_TIMELINE, payload: timeline, timestamp, memento });
        memento();
    };
};

export const deleteEntity = (authUser: IAuthenticatedUser, timeline: ITimeline) => {
    return (dispatch: any) => {
        const url = `${apiConstants.timelinesController}/delete?authorId=${authUser.authorId}&timelineId=${timeline.timelineId}`;
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
                dispatch({ type: timelineConstants.DELETE_TIMELINE_SUCCESS, timestamp });
            }).catch((err) => {
                const error: ITimelineErrorState = {
                    internalErrorMessage: `Received the following error while attempting to delete the specified timeline record from the API: ${err}`,
                    displayErrorMessage: `Encountered error while attempting to contact the API.  Will retry automatically when connectivity is restored.`
                }
                dispatch({ type: timelineConstants.DELETE_TIMELINE_ERROR, error, timestamp });
            });
        };
        dispatch({ type: timelineConstants.DELETE_TIMELINE, payload: timeline, timestamp, memento });
        memento();
    };
};

