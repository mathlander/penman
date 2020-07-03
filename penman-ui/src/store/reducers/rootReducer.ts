import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { StorageManager } from '../algorithms/storageManager';
import offlineReducer from './offlineReducer';
import dashboardReducer from './dashboardReducer';
import generateManagedAuthReducer from './authReducer';
import generateManagedPromptReducer from './promptReducer';
import { IStorageManager } from '../type-defs/storage-types';
import { IPenmanAction } from '../type-defs/action-types';

export const history = createBrowserHistory();

const storageManager = new StorageManager();
const storageManagerReducer = (state: IStorageManager = storageManager, action: IPenmanAction) => state;

const rootReducer = combineReducers({
    router: connectRouter(history),
    offline: offlineReducer,
    dashboard: dashboardReducer,
    auth: generateManagedAuthReducer(storageManager),
    prompt: generateManagedPromptReducer(storageManager),
    storageManager: storageManagerReducer,
});

export default rootReducer;
