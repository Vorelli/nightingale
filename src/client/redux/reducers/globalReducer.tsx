import { createSlice } from "@reduxjs/toolkit";

interface InitialState {
  HOST: string;
  URL: string;
  audioPlayable: boolean;
  reloadSong: boolean;
}
const HOST = process.env.HOST as string;
const PROTO = process.env.PROTO as string;

const initialState: InitialState = {
  HOST,
  URL: PROTO + HOST,
  audioPlayable: false,
  reloadSong: true,
};

export const globalReducer = createSlice({
  name: "global",
  initialState,
  reducers: {
    setAudioPlayable: (state, action) => {
      state.audioPlayable = action.payload;
    },
    setReloadSong: (state, action) => {
      state.reloadSong = action.payload;
    },
  },
});

export const { setAudioPlayable, setReloadSong } = globalReducer.actions;

export default globalReducer.reducer;
