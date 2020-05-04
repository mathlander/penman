import { combineReducers } from 'redux';
import authReducer from './authReducer';
import welcomeReducer from './welcomeReducer';
import bookReducer from './bookReducer';
import chapterReducer from './chapterReducer';
import personificationReducer from './personificationReducer';
import promptReducer from './promptReducer';
import shortReducer from './shortReducer';
import timelineReducer from './timelineReducer';

const rootReducer = combineReducers({
    auth: authReducer,
    welcome: welcomeReducer,
    book: bookReducer,
    chapter: chapterReducer,
    personification: personificationReducer,
    prompt: promptReducer,
    short: shortReducer,
    timeline: timelineReducer,
});

export default rootReducer;
