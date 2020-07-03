import { IReplayableAction } from '../type-defs/storage-types';
import { IError } from '../type-defs/error-types';

export interface IPenmanAction {
    timestamp: number;
    suppressTimeoutAlert: boolean;
    type: string;
    payload: any;
    error: IError;
    memento: IReplayableAction;
};
