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

const store = createStore(rootReducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())

function App() {
  return (

    <UseSessionProvider>
      <Provider store={store}>
        <Router>
          <Switch>
            <Route exact path="/:page?/:sub?/:index?" component={_mainPage} />
            <Route path="/" component={notFound} />
          </Switch>
        </Router>
      </Provider>
    </UseSessionProvider>

  );
}

export default App;
