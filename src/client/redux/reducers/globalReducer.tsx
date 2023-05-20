import { createSlice } from "@reduxjs/toolkit/dist";

interface InitialState {
  HOST: string;
  URL: string;
  audioPlayable: boolean;
  reloadSong: boolean;
}
const HOST = location.host.indexOf("localhost:8080") !== -1 ? "localhost:3000" : location.host;
const PROTO = location.protocol + "//";

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
