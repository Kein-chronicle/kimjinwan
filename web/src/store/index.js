import { combineReducers } from 'redux';
import dataStore from './data.store';

const rootReducer = combineReducers({
    dataStore,
});

export default rootReducer;