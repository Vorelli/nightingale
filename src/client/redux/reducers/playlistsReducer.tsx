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
      const index = state.playlists.reduce((acc, playlist, i) => {
        return acc !== -1 || playlist.id !== action.payload ? acc : i;
      }, -1);
      if (index === -1) {
        console.log(
          "for some reason, couldn't find the playlist",
          action.payload,
          index,
          state.playlists.length
        );
        return;
      }
      state.playlistIndex = index;
    },
    changePlaylistName: (state, action) => {
      const playlist = state.playlists.find((playlist) => playlist.id === action.payload.id);
      if (playlist) {
        playlist.name = action.payload.name;
      }
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
