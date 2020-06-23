import axios, { AxiosRequestConfig } from 'axios';
import { IAuthenticatedUser, IReplayableAction } from '../types';
import { apiConstants, offlineConstants } from '../../constants';

export const replayMementos = (user: IAuthenticatedUser, replayableActions: IReplayableAction[], isOffline: boolean) => {
    replayableActions.forEach((action) => action.playAction(user, isOffline));
};

export const ping = () => {
    return (dispatch: any) => {
        const url = apiConstants.ping;
        const config: AxiosRequestConfig = {
            timeout: apiConstants.timeout,
        };
        const timestamp = Date.now();
        axios.get(
            url,
            config
        ).then(() => {
            dispatch({ type: offlineConstants.GO_ONLINE, timestamp });
        }).catch(() => {
            dispatch({ type: offlineConstants.GO_OFFLINE, timestamp });
        });
    };
};
