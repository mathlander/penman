import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { routerMiddleware } from 'connected-react-router';
import rootReducer, { history } from './store/reducers/rootReducer';

// import https from 'https';
// // enable the use of self-signed certificates
// https.globalAgent = new https.Agent({ rejectUnauthorized: false });

const store = createStore(
  rootReducer,
  applyMiddleware(
    thunk,
    routerMiddleware(history)
  )
);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.register();
