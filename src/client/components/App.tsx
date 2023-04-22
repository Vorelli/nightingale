import React, { useEffect } from "react";
import Desktop from "./Desktop";
import { useDispatch, useSelector } from "react-redux";
import {
  ClientSong,
  currentSongRequest,
  currentSongRequestSuccess,
  setStartTime,
  songsRequest,
  songsRequestSuccess,
} from "../redux/reducers/songsReducer";
import {
  ClientPlaylist,
  requestPlaylists,
  requestPlaylistsSuccess,
} from "../redux/reducers/playlistsReducer";
import { setStatus } from "../redux/reducers/settingsReducer";
import { RootState } from "../redux/store";
import { AudioContextProvider } from "./AudioContextProvider";
import { NodeContextProvider } from "./NodeContextProvider";
import { setReloadSong } from "../redux/reducers/globalReducer";

const App = () => {
  const dispatch = useDispatch();
  const { URL, HOST, reloadSong } = useSelector((s: RootState) => s.global);

  interface md5ToSong {
    [key: string]: ClientSong;
  }

  useEffect(() => {
    const ws = new WebSocket((process.env.PROTO === "https://" ? "wss://" : "ws://") + HOST);
    ws.onerror = function (err) {
      console.log("failed to connect to the websocket server:", err);
    };

    ws.onmessage = function (data) {
      if (data.data === "sync") {
        dispatch(setReloadSong(true));
      } else if (data.data === "PLAYING") {
        dispatch(setStatus("PLAYING"));
      } else if (data.data === "PAUSED") {
        dispatch(setStatus("PAUSED"));
      } else if (data.data.indexOf("setTime ") === 0) {
        const parsedTime = parseFloat(data.data.slice(8));
        if (!isNaN(parsedTime)) {
          dispatch(setStartTime(parsedTime));
        } else {
          console.log("received unexpected data", data);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (reloadSong) {
      dispatch(currentSongRequest());
      fetch(URL + "/api/sync")
        .then((data) => data.json())
        .then((syncData) => {
          if (syncData.currentSong && (syncData.currentTime === 0 || syncData.currentTime)) {
            dispatch(currentSongRequestSuccess(syncData.currentSong));
            dispatch(setStartTime(syncData.currentTime));
            dispatch(setStatus(syncData.status));
          }
        })
        .catch((err) => {
          console.log("error encountered when trying to sync with the server", err);
        })
        .finally(() => dispatch(setReloadSong(false)));
    }
  }, [reloadSong]);

  useEffect(() => {
    dispatch(songsRequest());
    fetch(URL + "/api/songs")
      .then((data) => data.json())
      .then((data: ClientSong[]) => {
        const keys = data.map((song: ClientSong) => song.md5);
        const songs: md5ToSong = {};
        for (var i = 0; i < keys.length; i++) {
          songs[keys[i]] = data[i];
        }
        dispatch(songsRequestSuccess(songs));
      });
  }, []);

  useEffect(() => {
    dispatch(requestPlaylists());
    fetch(URL + "/api/playlists")
      .then((data) => data.json())
      .then((data) => {
        if (data.length === 0) {
          dispatch(
            requestPlaylistsSuccess([
              {
                id: 1,
                name: "Playlist 1",
                songs: [],
              } as ClientPlaylist,
            ])
          );
        } else {
          dispatch(requestPlaylistsSuccess(data));
        }
      });
  }, []);

  return (
    <NodeContextProvider>
      <AudioContextProvider>
        <Desktop />
      </AudioContextProvider>
    </NodeContextProvider>
  );
};
App.whyDidYouRender = true;
export default App;
