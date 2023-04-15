import { createSlice } from "@reduxjs/toolkit";

interface Playlist {
  id: number;
  name: string;
  songs: [];
}

interface InitialState {
  playlists: Playlist[];
  loading: boolean;
}

const initialState: InitialState = {
  playlists: [],
  loading: false,
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
  },
});

export const { requestPlaylistsSuccess, deletePlaylist, requestPlaylists } =
  playlistsReducer.actions;

export default playlistsReducer.reducer;
