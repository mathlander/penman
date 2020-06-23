import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import authReducer from './authReducer';
import dashboardReducer from './dashboardReducer';
import offlineReducer from './offlineReducer';
import bookReducer from './bookReducer';
import chapterReducer from './chapterReducer';
import personificationReducer from './personificationReducer';
import promptReducer from './promptReducer';
import shortReducer from './shortReducer';
import tagReducer from './tagReducer';
import relationshipReducer from './relationshipReducer';
import notificationReducer from './notificationReducer';
// import collaborationReducer from './collaborationReducer';

export const history = createBrowserHistory();

const rootReducer = combineReducers({
    router: connectRouter(history),
    auth: authReducer,
    dashboard: dashboardReducer,
    offline: offlineReducer,
    book: bookReducer,
    chapter: chapterReducer,
    personification: personificationReducer,
    prompt: promptReducer,
    short: shortReducer,
    tag: tagReducer,
    relationship: relationshipReducer,
    notification: notificationReducer,
    // collaboration: collaborationReducer,
});

export default rootReducer;
