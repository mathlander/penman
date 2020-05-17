import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import authReducer from './authReducer';
import welcomeReducer from './welcomeReducer';
import dashboardReducer from './dashboardReducer';
import offlineReducer from './offlineReducer';
import bookReducer from './bookReducer';
import chapterReducer from './chapterReducer';
import personificationReducer from './personificationReducer';
import promptReducer from './promptReducer';
import shortReducer from './shortReducer';
import timelineReducer from './timelineReducer';

export const history = createBrowserHistory();

const rootReducer = combineReducers({
    router: connectRouter(history),
    auth: authReducer,
    welcome: welcomeReducer,
    dashboard: dashboardReducer,
    offline: offlineReducer,
    book: bookReducer,
    chapter: chapterReducer,
    personification: personificationReducer,
    prompt: promptReducer,
    short: shortReducer,
    timeline: timelineReducer,
});

export default rootReducer;
