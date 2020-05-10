import axios, { AxiosRequestConfig } from 'axios';
import { IAuthenticatedUser, IReplayableAction } from '../types';
import { apiConstants, offlineConstants } from '../../config/constants';

export const replayMementos = (user: IAuthenticatedUser, replayableActions: IReplayableAction[], suppressTimeoutAlert = true) => {
    replayableActions
        .forEach((replayableAction) => replayableAction.memento(user, suppressTimeoutAlert));
};

export const ping = () => {
    return (dispatch: any) => {
        const url = apiConstants.ping;
        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        axios.get(
            url,
            config
        ).then((response) => {
            dispatch({ type: offlineConstants.GO_ONLINE, timestamp });
        }).catch((err) => {
            dispatch({ type: offlineConstants.GO_OFFLINE, timestamp });
        });
    };
}
