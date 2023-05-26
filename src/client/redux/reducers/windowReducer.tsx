import { createSlice } from "@reduxjs/toolkit";

export interface Window {
  hidden: boolean;
  onTop: boolean;
}

export interface Windows {
  [key: string]: Window;
}

export interface State {
  windows: Windows;
  windowOrder: string[];
}
const windowNames = ["main", "files", "info", "projects", "resume"];

const initialWindowsState: Windows = windowNames.reduce(
  (acc: Windows, name: string) => {
    acc[name] = {
      hidden: false,
      onTop: name === "main" ? false : true,
    } as Window;
    return acc;
  },
  {} as Windows
);

const initialState: State = {
  windows: initialWindowsState,
  windowOrder: ["main"],
};

export const windowReducer = createSlice({
  name: "windows",
  initialState,
  reducers: {
    toggleHidden: (state, action) => {
      state.windows[action.payload.name].hidden =
        !state.windows[action.payload.name].hidden;
    },
    toggleOnTop: (state, action) => {
      const current = state.windows[action.payload.name].onTop;
      state.windows[action.payload.name].onTop = !current;
      console.log("currentOnTop:", current);
      if (current) {
        state.windowOrder = [action.payload.name, ...state.windowOrder];
      } else {
        let index = -1;
        for (let i = 0; i < state.windowOrder.length; i++) {
          if (state.windowOrder[i] === action.payload.name) {
            index = i;
            break;
          }
        }
        if (index === -1) return state;
        console.log("found:", action.payload.name);
        state.windowOrder = state.windowOrder
          .slice(0, index)
          .concat(state.windowOrder.slice(index + 1));
      }
    },
    handleDragStart: (state, action) => {
      let index = -1;
      for (let i = 0; i < state.windowOrder.length; i++) {
        if (state.windowOrder[i] === action.payload.name) {
          index = i;
          break;
        }
      }
      if (index === -1) return state;
      state.windowOrder.splice(index, 1);
      state.windowOrder.unshift(action.payload.name);
    },
  },
});

export const { toggleHidden, toggleOnTop, handleDragStart } =
  windowReducer.actions;

export default windowReducer.reducer;
