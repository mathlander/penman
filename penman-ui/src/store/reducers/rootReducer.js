import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
// import { StorageManager } from '../algorithms/storageManager';
// import offlineReducer from './offlineReducer';
// import dashboardReducer from './dashboardReducer';
// import generateManagedAuthReducer from './authReducer';
// import generateManagedPromptReducer from './promptReducer';

export const history = createBrowserHistory();

// const storageManager = new StorageManager();
// const storageManagerReducer = (state = storageManager, action) => state;

const rootReducer = combineReducers({
    router: connectRouter(history),
    // offline: offlineReducer,
    // dashboard: dashboardReducer,
    // auth: generateManagedAuthReducer(storageManager),
    // prompt: generateManagedPromptReducer(storageManager),
    // storageManager: storageManagerReducer,
});

export default rootReducer;
