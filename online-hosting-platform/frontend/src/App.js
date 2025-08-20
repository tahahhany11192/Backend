import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import HostSession from './pages/HostSession';
import StudentSession from './pages/StudentSession';
import './styles/main.css';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/host" component={HostSession} />
        <Route path="/student" component={StudentSession} />
        <Route path="/" exact>
          <h1>Welcome to the Online Hosting Platform</h1>
          <p>Please choose a session type:</p>
          <ul>
            <li><a href="/host">Host a Session</a></li>
            <li><a href="/student">Join a Session</a></li>
          </ul>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;