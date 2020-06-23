import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDispatch } from 'react-redux';
import { apiConstants, offlineConstants, tagConstants } from '../../constants';
import { IReplayableAction, Tag, IReplayUser, IError, ErrorCodes, IClientTag, ITagCollection, nullError } from '../types';

export class TagActionMemento implements IReplayableAction {
    public tag: Tag;
    public type: string;
    public timestamp: number;
    public lastReadAllISOString: string;
    public serializedData: string;

    constructor(tag: Tag, type: string, timestamp: number, lastReadAllISOString = '') {
        this.tag = tag;
        this.type = type;
        this.timestamp = timestamp;
        this.lastReadAllISOString = lastReadAllISOString;
        this.serializedData = TagActionMemento.dehydrate(this);
    }

    static hydrate(memento: string) {
        const restoredMemento = JSON.parse(memento, (key, value) => {
            if (key === 'tag') return Tag.fromSerializedJSON(value);
            else return value;
        });
        return new TagActionMemento(restoredMemento.tag, restoredMemento.type, restoredMemento.timestamp, restoredMemento.lastReadAllISOString);
    }

    static dehydrate(actionMemento: TagActionMemento) {
        const serializedMemento = JSON.stringify({
            tag: actionMemento.tag.toSerializedJSON(),
            type: actionMemento.type,
            timestamp: actionMemento.timestamp,
            lastReadAllISOString: actionMemento.lastReadAllISOString,
        });
        return serializedMemento;
    }

    public playAction(user: IReplayUser, isOffline: boolean) {
        switch (this.type) {
            case tagConstants.CREATE_NEW_TAG:
                this.create(user, isOffline, true);
                break;
            case tagConstants.UPDATE_TAG:
                this.update(user, isOffline, true);
                break;
            case tagConstants.DELETE_TAG:
                this.deleteEntity(user, isOffline, true);
                break;
            case tagConstants.READ_TAG:
                this.read(user, isOffline, true);
                break;
            case tagConstants.READ_ALL_TAGS:
                this.readAll(user, isOffline, true);
                break;
            default:
                break;
        }
    }

    public create(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.tagsController}/create`;
        const data = this.tag.toCreateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: tagConstants.CREATE_NEW_TAG, payload: this.tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            // avoid foreign key errors by tag-circuiting the attempt when offline unless forced by the OfflineManager
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: tagConstants.CREATE_NEW_TAG_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.post(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientTag>) => {
            this.tag.onApiProcessed(response.data, true);
            dispatch({ type: tagConstants.CREATE_NEW_TAG_SUCCESS, payload: this.tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: tagConstants.CREATE_NEW_TAG_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else if (err.response && err.response.data && err.response.data.errorCode === ErrorCodes.clientIdCollided) {
                this.tag.handleIdCollision();
                this.create(user, isOffline);
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to create the new tag: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: tagConstants.CREATE_NEW_TAG_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public update(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.tagsController}/update`;
        const data = this.tag.toUpdateDto();
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: tagConstants.UPDATE_TAG, payload: this.tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: tagConstants.UPDATE_TAG_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.patch(
            url,
            data,
            config
        ).then((response: AxiosResponse<IClientTag>) => {
            this.tag.onApiProcessed(response.data, true);
            dispatch({ type: tagConstants.UPDATE_TAG_SUCCESS, payload: this.tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: tagConstants.UPDATE_TAG_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to update the specified tag: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: tagConstants.UPDATE_TAG_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public deleteEntity(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.tagsController}/delete?userId=${user.userId}&tagId=${this.tag.tagId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: tagConstants.DELETE_TAG, payload: this.tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: tagConstants.DELETE_TAG_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.delete(
            url,
            config
        ).then(() => {
            dispatch({ type: tagConstants.DELETE_TAG_SUCCESS, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: tagConstants.DELETE_TAG_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to delete the specified tag: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: tagConstants.DELETE_TAG_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public read(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.tagsController}/read?tagId=${this.tag.tagId}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: tagConstants.READ_TAG, payload: this.tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: tagConstants.READ_TAG_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<IClientTag>) => {
            this.tag.onApiProcessed(response.data);
            dispatch({ type: tagConstants.READ_TAG_SUCCESS, payload: this.tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: tagConstants.READ_TAG_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve the specified tag: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: tagConstants.READ_TAG_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        });
    }

    public readAll(user: IReplayUser, isOffline: boolean, force = false) {
        const dispatch = useDispatch();
        const url = `${apiConstants.tagsController}/readall?userId=${this.tag.userId}&lastReadAll=${this.lastReadAllISOString}`;
        const config: AxiosRequestConfig = {
            headers: {
                'Authorization': `Bearer ${user.token}`,
            },
            timeout: apiConstants.timeout,
        };
        dispatch({ type: tagConstants.READ_ALL_TAGS, payload: this.tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        if (isOffline && !force) {
            const error = Object.assign({}, nullError, { errorCode: ErrorCodes.apiUnreachable });
            dispatch({ type: tagConstants.READ_ALL_TAGS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            return;
        }
        axios.get(
            url,
            config
        ).then((response: AxiosResponse<ITagCollection>) => {
            const lastReadAll = new Date(response.data.lastReadAll);
            const tagCollection = response.data.tags;
            tagCollection.forEach((tagDto) => {
                const tag = new Tag(tagDto);
                dispatch({ type: tagConstants.READ_TAG_SUCCESS, payload: tag, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            });
            dispatch({ type: tagConstants.READ_ALL_TAGS_SUCCESS, payload: { targetUserId: this.tag.userId, lastReadAll }, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
        }).catch((err) => {
            if (err.code === 'ECONNABORTED' || err.response === undefined) {
                const error: IError = {
                    displayErrorMessage: offlineConstants.API_UNREACHABLE_DISPLAY_MESSAGE,
                    internalErrorMessage: offlineConstants.API_UNREACHABLE_INTERNAL_MESSAGE,
                    errorCode: ErrorCodes.apiUnreachable,
                };
                dispatch({ type: tagConstants.READ_ALL_TAGS_TIMEOUT, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            } else {
                const error: IError = Object.assign({
                    displayErrorMessage: `Encountered an error while attempting to process the request.  The action will not be automatically retried.`,
                    internalErrorMessage: `Received error code [${err.errorCode}] while attempting to retrieve all tags for the specified book: ${err}`,
                    errorCode: ErrorCodes.unknown,
                }, err.response.data);
                dispatch({ type: tagConstants.READ_ALL_TAGS_ERROR, error, timestamp: this.timestamp, suppressTimeoutAlert: isOffline, memento: this });
            }
        })
    }
}

export const create = (user: IReplayUser, newTag: Tag, isOffline = false) => {
    const timestamp = Date.now();
    newTag.tagId = -timestamp;
    const memento = new TagActionMemento(newTag, tagConstants.CREATE_NEW_TAG, timestamp);
    memento.create(user, isOffline);
};

export const update = (user: IReplayUser, tag: Tag, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new TagActionMemento(tag, tagConstants.UPDATE_TAG, timestamp);
    memento.update(user, isOffline);
};

export const deleteEntity = (user: IReplayUser, tag: Tag, isOffline = false) => {
    const timestamp = Date.now();
    const memento = new TagActionMemento(tag, tagConstants.DELETE_TAG, timestamp);
    memento.deleteEntity(user, isOffline);
};

export const read = (user: IReplayUser, tagId: number, isOffline = false) => {
    const timestamp = Date.now();
    const tag = new Tag();
    tag.tagId = tagId;
    const memento = new TagActionMemento(tag, tagConstants.READ_TAG, timestamp);
    memento.read(user, isOffline);
};

export const readAll = (user: IReplayUser, targetUserId: number, lastReadAll: Date, isOffline = false) => {
    const timestamp = Date.now();
    const dummyTag = new Tag();
    dummyTag.userId = targetUserId;
    const memento = new TagActionMemento(dummyTag, tagConstants.READ_ALL_TAGS, timestamp, lastReadAll.toISOString());
    memento.readAll(user, isOffline);
};
