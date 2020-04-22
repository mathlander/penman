import { combineReducers } from 'redux';
import authReducer from './authReducer';
import welcomeReducer from './welcomeReducer';

const rootReducer = combineReducers({
    auth: authReducer,
    welcome: welcomeReducer,
});

export default rootReducer;
