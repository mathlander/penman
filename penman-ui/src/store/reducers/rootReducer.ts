import { combineReducers } from 'redux';
import authReducer from './authReducer';
import welcomeReducer from './welcomeReducer';
import bookReducer from './bookReducer';

const rootReducer = combineReducers({
    auth: authReducer,
    welcome: welcomeReducer,
    book: bookReducer,
});

export default rootReducer;
