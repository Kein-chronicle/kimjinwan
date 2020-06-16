const DATASET = 'DATASET';

const initialState = {
    showTops: true
}

const data = (state = initialState, action) => {

  switch (action.type) {
    case DATASET:
      return {...state, 
        showTops: action.showTops
    }
    default:
      return state;
  }
};

export default data;