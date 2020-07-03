import { RouterState } from 'connected-react-router';
import { IOfflineState } from './offline-types';
import { IDashboardState } from './dashboard-types';
import { IAuthenticationState } from './auth-types';
import { IPromptState } from './prompt-types';
import { IStorageManager } from './storage-types';

export interface IRootState {
    router: RouterState<History<HistoryLocationState>>,
    offline: IOfflineState,
    dashboard: IDashboardState,
    auth: IAuthenticationState,
    prompt: IPromptState,
    storageManager: IStorageManager,
};
