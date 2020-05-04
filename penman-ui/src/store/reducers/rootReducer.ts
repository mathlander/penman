import { combineReducers } from 'redux';
import authReducer from './authReducer';
import welcomeReducer from './welcomeReducer';
import bookReducer from './bookReducer';
import chapterReducer from './chapterReducer';
import personificationReducer from './personificationReducer';

const rootReducer = combineReducers({
    auth: authReducer,
    welcome: welcomeReducer,
    book: bookReducer,
    chapter: chapterReducer,
    personification: personificationReducer,
});

export default rootReducer;
