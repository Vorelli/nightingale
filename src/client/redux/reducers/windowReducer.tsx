import { createSlice } from "@reduxjs/toolkit";

export interface Window {
  hidden: boolean;
  onTop: boolean;
}

export interface State {
  [key: string]: Window;
}
const windowNames = [
  'music',
  'files',
  'info',
  'projects',
  'resume'
];

const initialState: State = windowNames.reduce((acc: State, name: string) => {
    acc[name] = ({
      hidden: true,
      onTop: true
    }) as Window
    return acc;
  }, {} as State)

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
