import React, { useState, useEffect } from "react";
import Desktop from "./Desktop";
import { useDispatch } from "react-redux";
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

const App = () => {
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();
  const HOST = "toscanonatale.dev";
  const URL = "https://" + HOST;
  const [reloadSong, setReloadSong] = useState(true);

  useEffect(() => {
    const ws = new WebSocket("wss://" + HOST);
    ws.onopen = function () {
      console.log("connected to web socket server");
    };

    ws.onmessage = function (data) {
      console.log("received message:", data);
      if (data.data === "nextSong") {
        console.log("reloading song");
        setReloadSong(true);
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
          }
        })
        .catch((err) => {
          console.log("error encountered when trying to sync with the server", err);
        });
      setReloadSong(false);
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

  useEffect(() => {
    console.log("Count:", count);
  });
  console.log("hello");

  return <Desktop />;
};
App.whyDidYouRender = true;
export default App;
