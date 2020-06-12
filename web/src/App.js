import React from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Route,
  Switch
} from "react-router-dom";
import { UseSessionProvider } from 'react-session-hook'
import { createStore } from 'redux';
import { Provider } from 'react-redux';

// pages
import _mainPage from './components/main.page'
import notFound from './components/not.found'

// store root
import rootReducer from './store'

const store = createStore(rootReducer)

function App() {
  return (

    <UseSessionProvider>
      <Provider store={store}>
        <Router>
          <Switch>
            <Route exact path="/:page?" component={_mainPage} />
            <Route path="/" component={notFound} />
          </Switch>
        </Router>
      </Provider>
    </UseSessionProvider>

  );
}

export default App;
