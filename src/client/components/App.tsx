import React, { useState, useEffect } from "react";
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

const App = () => {
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();
  const [reloadSong, setReloadSong] = useState(true);
  const { URL, HOST } = useSelector((s: RootState) => s.global);
  const { status } = useSelector((s: RootState) => s.settings);

  useEffect(() => {
    const ws = new WebSocket("wss://" + HOST);
    ws.onopen = function () {
      console.log("connected to web socket server");
    };

    ws.onmessage = function (data) {
      console.log("received message:", data);
      if (data.data === "sync") {
        setReloadSong(true);
      } else if (data.data === "PLAYING") {
        dispatch(setStatus("PLAYING"));
      } else if (data.data === "PAUSED") {
        dispatch(setStatus("PAUSED"));
      } else if (data.data.indexOf("setTime ") === 0) {
        const parsedTime = parseFloat(data.data.slice(8));
        if (!isNaN(parsedTime)) {
          dispatch(setStartTime(parsedTime));
          dispatch(setStatus(status));
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
          console.log("sync data", syncData);
          if (syncData.currentSong && (syncData.currentTime === 0 || syncData.currentTime)) {
            dispatch(currentSongRequestSuccess(syncData.currentSong));
            dispatch(setStartTime(syncData.currentTime));
            dispatch(setStatus(syncData.status));
          }
        })
        .catch((err) => {
          console.log("error encountered when trying to sync with the server", err);
        })
        .finally(() => setReloadSong(false));
    }
  }, [reloadSong]);

  interface md5ToSong {
    [key: string]: ClientSong;
  }

  useEffect(() => {
    dispatch(songsRequest());
    fetch(URL + "/api/songs")
      .then((data) => data.json())
      .then((data: ClientSong[]) => {
        console.log("data from server", data);
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
        console.log("data from server", data);
        if (data.length === 0) {
          dispatch(
            requestPlaylistsSuccess([
              {
                id: 1,
                name: "Lol",
                songs: [],
              } as ClientPlaylist,
            ])
          );
        } else {
          dispatch(requestPlaylistsSuccess(data));
        }
      });
  }, []);

  return <Desktop />;
};
App.whyDidYouRender = true;
export default App;
