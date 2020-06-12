const DATASET = 'DATASET';

const initialState = {
    data: ''
}

const data = (state = initialState, action) => {

  switch (action.type) {
    case DATASET:
      return {...state, 
        data: action.data
    }
    default:
      return state;
  }
};

export default data;