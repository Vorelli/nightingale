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
  lyrics: string[];
  [key: string]: any;
}

interface InitialState {
  loading: boolean;
  songs: { [key: string]: ClientSong };
  currentSong: string | undefined;
  currentSongLoading: boolean;
  startingTime: number;
  currentTime: number;
  volume: number;
}

const initialState: InitialState = {
  loading: false,
  songs: {},
  currentSong: undefined,
  currentSongLoading: false,
  startingTime: 0,
  currentTime: 0,
  volume: 0.05,
};

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
    currentSongRequestSuccess: (state, action) => {
      state.currentSong = action.payload;
      state.currentSongLoading = false;
    },
    currentSongRequest: (state) => {
      state.currentSongLoading = true;
    },
    setStartTime: (s, action) => {
      s.startingTime = action.payload;
    },
    setCurrentTime: (s, action) => {
      s.currentTime = action.payload;
    },
    setVolume: (s, action) => {
      s.volume = action.payload;
    },
  },
});

export const {
  songsRequest,
  songsRequestSuccess,
  setStartTime,
  currentSongRequest,
  currentSongRequestSuccess,
  setCurrentTime,
  setVolume,
} = songsReducer.actions;
export type { ClientSong };
export default songsReducer.reducer;
