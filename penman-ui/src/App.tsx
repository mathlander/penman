import React from 'react';
import { ConnectedRouter } from 'connected-react-router';
import { Switch, Route } from 'react-router-dom';
import { history } from './store/reducers/rootReducer';
import OfflineManager from './components/offline/OfflineManager';
import CustomInputManager from './components/text/CustomInputManager';
import Toaster from './components/toaster/Toaster';
import Navbar from './components/layout/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import BooksPage from './components/book/BooksPage';
import PersonificationsPage from './components/personification/PersonificationsPage';
import PromptsPage from './components/prompt/PromptsPage';
import ShortsPage from './components/short/ShortsPage';
import TimelinesPage from './components/timeline/TimelinesPage';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import Welcome from './components/welcome/Welcome';
import './App.css';

function App() {
  return (
    <ConnectedRouter history={history}>
      <div className="App">
        <OfflineManager />
        <CustomInputManager />
        <Toaster />
        <Navbar />
        <Switch>
          <Route exact path="/" component={Welcome} />
          <Route path="/signin" component={SignIn} />
          <Route path="/signup" component={SignUp} />
          <Route path="/welcome" component={Welcome} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/books" component={BooksPage} />
          <Route path="/personifications" component={PersonificationsPage} />
          <Route path="/prompts" component={PromptsPage} />
          <Route path="/shorts" component={ShortsPage} />
          <Route path="/timelines" component={TimelinesPage} />
        </Switch>
      </div>
    </ConnectedRouter>
  );
}

export default App;
