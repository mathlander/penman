import React from 'react';
import { ConnectedRouter } from 'connected-react-router';
import { Switch, Route } from 'react-router-dom';
import { history } from './store/reducers/rootReducer';
import OfflineManager from './components/offline/OfflineManager';
import Toaster from './components/toaster/Toaster';
import Navbar from './components/layout/Navbar';
import DashboardPage from './components/dashboard/DashboardPage';
// import PromptsPage from './components/prompt/PromptsPage';
import SignInPage from './components/auth/SignInPage';
import SignUpPage from './components/auth/SignUpPage';
import WelcomePage from './components/welcome/WelcomePage';
import './App.css';

function App() {
  return (
    <ConnectedRouter history={history}>
      <div className="App">
        <OfflineManager />
        <Toaster />
        <Navbar />
        <Switch>
          <Route exact path="/" component={WelcomePage} />
          <Route path="/signin" component={SignInPage} />
          <Route path="/signup" component={SignUpPage} />
          <Route path="/welcome" component={WelcomePage} />
          <Route path="/dashboard" component={DashboardPage} />
          {/* <Route path="/prompts" component={PromptsPage} /> */}
        </Switch>
      </div>
    </ConnectedRouter>
  );
}

export default App;
