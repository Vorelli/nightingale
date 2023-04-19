import { createSlice } from "@reduxjs/toolkit";

interface InitialState {
  HOST: string;
  URL: string;
}
const HOST = "toscanonatale.dev";
const initialState: InitialState = {
  HOST,
  URL: "https://" + HOST,
};

export const globalReducer = createSlice({
  name: "global",
  initialState,
  reducers: {},
});

export const {} = globalReducer.actions;

export default globalReducer.reducer;
