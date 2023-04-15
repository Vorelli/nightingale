import { createSlice } from "@reduxjs/toolkit";

interface Window {
  hidden: boolean;
  onTop: boolean;
}

interface InitialState {
  [key: string]: Window;
}

const initialState: InitialState = {
  main: {
    hidden: false,
    onTop: false,
  },
};

export const windowReducer = createSlice({
  name: "windows",
  initialState,
  reducers: {
    toggleHidden: (state, action) => {
      state[action.payload.name].hidden = !state[action.payload.name].hidden;
    },
    toggleOnTop: (state, action) => {
      state[action.payload.name].onTop = !state[action.payload.name].onTop;
    },
  },
});

export const { toggleHidden, toggleOnTop } = windowReducer.actions;

export default windowReducer.reducer;
