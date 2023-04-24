import { createSlice } from "@reduxjs/toolkit";

export interface ClientPlaylist {
  id: number;
  name: string;
  songs: string[];
}

interface InitialState {
  playlists: ClientPlaylist[];
  loading: boolean;
  playlistIndex: number;
}

const initialState: InitialState = {
  playlists: [],
  loading: false,
  playlistIndex: 0,
};

export const playlistsReducer = createSlice({
  name: "playlists",
  initialState,
  reducers: {
    requestPlaylistsSuccess: (state, action) => {
      state.playlists = action.payload;
      state.loading = false;
    },
    deletePlaylist: (state, action) => {
      state.playlists = state.playlists.filter((playlist) => playlist.id !== action.payload);
    },
    requestPlaylists: (state) => {
      state.loading = true;
    },
    setPlaylistIndex: (state, action) => {
      state.playlistIndex = action.payload;
    },
    changePlaylistName: (state, action) => {
      state.playlists[action.payload.id].name = action.payload.name;
    },
  },
});

export const {
  requestPlaylistsSuccess,
  deletePlaylist,
  requestPlaylists,
  setPlaylistIndex,
  changePlaylistName,
} = playlistsReducer.actions;

export default playlistsReducer.reducer;
