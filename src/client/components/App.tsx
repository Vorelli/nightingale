import React, { useState, useEffect } from "react";
import Desktop from "./Desktop";
import { useDispatch } from "react-redux";
import { songsRequest, songsRequestSuccess } from "../redux/reducers/songsReducer";
import {
  ClientPlaylist,
  requestPlaylists,
  requestPlaylistsSuccess,
} from "../redux/reducers/playlistsReducer";

const App = () => {
  const [count, setCount] = useState(0);
  const dispatch = useDispatch();
  const URL = "https://toscanonatale.dev";

  useEffect(() => {
    dispatch(songsRequest());
    fetch(URL + "/api/songs")
      .then((data) => data.json())
      .then((data) => {
        console.log("data from server", data);
        dispatch(songsRequestSuccess(data));
      });

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

export default App;
