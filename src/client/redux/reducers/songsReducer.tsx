import { createSlice } from "@reduxjs/toolkit";

interface ClientSong {
  md5: string;
  name: string;
  path: string;
  duration: number;
  albumArtist: string;
  artists: string[];
  albumName: string;
  genres: string[];
  year: number;
  track: number;
  diskCharacter: number;
  lyrics: string[];
  [key: string]: any;
}

interface InitialState {
  loading: boolean;
  songs: { [key: string]: ClientSong };
}

const initialState: InitialState = { loading: false, songs: {} };

export const songsReducer = createSlice({
  name: "songs",
  initialState,
  reducers: {
    songsRequest: (state) => {
      state.loading = true;
    },
    songsRequestSuccess: (state, action) => {
      state.loading = false;
      state.songs = action.payload;
    },
  },
});

export const { songsRequest, songsRequestSuccess } = songsReducer.actions;
export type { ClientSong };
export default songsReducer.reducer;
