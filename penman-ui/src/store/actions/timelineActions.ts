import axios, { AxiosRequestConfig } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, timelineConstants, offlineConstants } from '../../config/constants';
import { IAuthenticatedUser, ITimeline, Timeline, ITimelineErrorState, IReplayableAction, restoreOfflineWorkItemFromJSON } from '../types';

export class TimelineActionMemento implements IReplayableAction {
    public timeline: Timeline;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string = '';
    public serializedData: string;

    constructor(timeline: Timeline, type: string, timestamp: number) {
        this.timeline = timeline;
        this.type = type;
        this.timestamp = timestamp;
        this.serializedData = TimelineActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'timeline') return restoreOfflineWorkItemFromJSON<Timeline>(value, Timeline);
            else return value;
        });
        const timelineMemento = new TimelineActionMemento(restoredMemento.timeline, restoredMemento.type, restoredMemento.timestamp);
        timelineMemento.lastReadAllISOString = restoredMemento.lastReadAllISOString || '';
        timelineMemento.serializedData = memento;
        return timelineMemento;
    }

    static dehydrate(actionMemento: TimelineActionMemento) {
        const serializedMemento = JSON.stringify({
            timeline: actionMemento.timeline.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAll: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user:IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        switch(this.type) {
            case timelineConstants.CREATE_NEW_TIMELINE:
                this.create(user, suppressTimeoutAlert);
                break;
            case timelineConstants.UPDATE_TIMELINE:
                this.update(user, suppressTimeoutAlert);
                break;
            case timelineConstants.DELETE_TIMELINE:
                this.deleteEntity(user, suppressTimeoutAlert);
                break;
            case timelineConstants.READ_TIMELINE:
                this.read(user, suppressTimeoutAlert);
                break;
            case timelineConstants.READ_ALL_TIMELINES:
                this.readAll(user, suppressTimeoutAlert);
                break;
            default:
                break;
        }
    }

    public create(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.timelinesController}/create`;
        const data = {
            ...this.timeline,
            eventStart: this.timeline.eventStart.toISOString(),
            eventEnd: this.timeline.eventEnd.toISOString(),
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE, payload: this.timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.post(
            url,
            data,
            config
        ).then((response) => {
            this.timeline.onApiProcessed(response.data);
            dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE_SUCCESS, payload: this.timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: ITimelineErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: ITimelineErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to register the new timeline record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: timelineConstants.CREATE_NEW_TIMELINE_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public update(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.timelinesController}/update`;
        const data = {
            ...this.timeline,
            eventStart: this.timeline.eventStart.toISOString(),
            eventEnd: this.timeline.eventEnd.toISOString(),
        };
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: timelineConstants.UPDATE_TIMELINE, payload: this.timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.patch(
            url,
            data,
            config
        ).then((response) => {
            this.timeline.onApiProcessed(response.data);
            dispatch({ type: timelineConstants.UPDATE_TIMELINE_SUCCESS, payload: this.timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: ITimelineErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: timelineConstants.UPDATE_TIMELINE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: ITimelineErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to update the specified timeline record with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: timelineConstants.UPDATE_TIMELINE_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public deleteEntity(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.timelinesController}/delete?authorId=${user.authorId}&timelineId=${this.timeline.timelineId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: timelineConstants.DELETE_TIMELINE, payload: this.timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: timelineConstants.DELETE_TIMELINE_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: ITimelineErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: timelineConstants.DELETE_TIMELINE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: ITimelineErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to delete the specified timeline record from the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: timelineConstants.DELETE_TIMELINE_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public read(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.timelinesController}/read?timelineId=${this.timeline.timelineId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: timelineConstants.READ_TIMELINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const timeline = new Timeline(response.data);
            dispatch({ type: timelineConstants.READ_TIMELINE_SUCCESS, payload: timeline, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: ITimelineErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: timelineConstants.READ_TIMELINE_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: ITimelineErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all timeline records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: timelineConstants.READ_TIMELINE_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }

    public readAll(user: IAuthenticatedUser, suppressTimeoutAlert: boolean) {
        const dispatch = useDispatch();
        const url = `${apiConstants.timelinesController}/readall?authorId=${user.authorId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: timelineConstants.READ_ALL_TIMELINES, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        axios.get(
            url,
            config
        ).then((response) => {
            const timelineCollection: ITimeline[] = response.data.timelines;
            const timelines: Timeline[] = [];
            timelineCollection.forEach((timelineDto, idx) => {
                const timeline = new Timeline(timelineDto);
                timelines.push(timeline);
            });
            dispatch({ type: timelineConstants.READ_ALL_TIMELINES_SUCCESS, payload: timelines, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                // timed out or the API wasn't running
                const error: ITimelineErrorState =  {
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                };
                dispatch({ type: timelineConstants.READ_ALL_TIMELINES_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
                dispatch({ type: offlineConstants.GO_OFFLINE, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            } else {
                // api returned a response... should only happen if refresh token somehow fails to process
                const error: ITimelineErrorState = err.response.data || {
                    internalErrorMessage: `Received the following error while attempting to retrieve all timeline records with the API: ${err}`,
                    displayErrorMessage: `Encountered an error while attempting to process the request.  This will not be automatically retried.`
                };
                dispatch({ type: timelineConstants.READ_ALL_TIMELINES_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert, memento: this });
            }
        });
    }
}

export const create = (authUser: IAuthenticatedUser, newTimeline: Timeline, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    newTimeline.timelineId = -timestamp;
    const memento = new TimelineActionMemento(newTimeline, timelineConstants.CREATE_NEW_TIMELINE, timestamp);
    memento.create(authUser, suppressTimeoutAlert);
};

export const readAll = (authUser: IAuthenticatedUser, lastReadAll: Date, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const dummyTimeline = new Timeline();
    const memento = new TimelineActionMemento(dummyTimeline, timelineConstants.READ_ALL_TIMELINES, timestamp);
    memento.lastReadAllISOString = lastReadAll.toISOString();
    memento.serializedData = TimelineActionMemento.dehydrate(memento);
    memento.readAll(authUser, suppressTimeoutAlert);
};

export const read = (authUser: IAuthenticatedUser, timelineId: number, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const timeline = new Timeline();
    timeline.timelineId = timelineId;
    const memento = new TimelineActionMemento(timeline, timelineConstants.READ_TIMELINE, timestamp);
    memento.read(authUser, suppressTimeoutAlert);
};

export const update = (authUser: IAuthenticatedUser, timeline: Timeline, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new TimelineActionMemento(timeline, timelineConstants.UPDATE_TIMELINE, timestamp);
    memento.update(authUser, suppressTimeoutAlert);
};

export const deleteEntity = (authUser: IAuthenticatedUser, timeline: Timeline, suppressTimeoutAlert = false) => {
    const timestamp = Date.now();
    const memento = new TimelineActionMemento(timeline, timelineConstants.DELETE_TIMELINE, timestamp);
    memento.deleteEntity(authUser, suppressTimeoutAlert);
};

