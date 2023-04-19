import { configureStore } from "@reduxjs/toolkit";
import windowReducer from "./reducers/windowReducer";
import playlistsReducer from "./reducers/playlistsReducer";
import settingsReducer from "./reducers/settingsReducer";
import songsReducer from "./reducers/songsReducer";
import globalReducer from "./reducers/globalReducer";

const store = configureStore({
  reducer: {
    windows: windowReducer,
    playlists: playlistsReducer,
    settings: settingsReducer,
    songs: songsReducer,
    global: globalReducer,
  },
});
export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
