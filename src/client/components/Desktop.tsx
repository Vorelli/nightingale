import React, { useEffect } from "react";
import MainPlayer from "./MainPlayer";
import Background from "./Background";
import { useDispatch, useSelector } from "react-redux";
import {
  ClientSong,
  setStartTime,
  songsRequest,
  songsRequestSuccess,
} from "../redux/reducers/songsReducer";
import {
  ClientPlaylist,
  requestPlaylists,
  requestPlaylistsSuccess,
  setPlaylistIndex,
} from "../redux/reducers/playlistsReducer";
import { setStatus } from "../redux/reducers/settingsReducer";
import { RootState } from "../redux/store";
import { useAudioContext } from "./AudioContextProvider";

interface Props {
  reloadSong: Function | undefined;
}

const InnerDesktop = React.memo(function Desktop({ reloadSong }: Props) {
  const dispatch = useDispatch();
  const { URL, HOST } = useSelector((s: RootState) => s.global);
  interface md5ToSong {
    [key: string]: ClientSong;
  }

  useEffect(() => {
    const ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + HOST);
    ws.onerror = function (err) {
      console.log("failed to connect to the websocket server:", err);
    };

    ws.onmessage = function (data) {
      if (!data.data) return;

      if (data.data === "sync") {
        reloadSong && reloadSong();
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

    return () => {
      ws.close();
    };
  }, [HOST]);

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
          dispatch(setPlaylistIndex(Object.keys(data)[0]));
        }
      });
  }, []);

  function handleClick(ev: React.MouseEvent) {
    if (
      ev.target instanceof Element &&
      Array.from((ev.target as Element).classList).includes("desktop")
    ) {
      ev.preventDefault();
      console.log("show change background modal");
    }
  }

  return (
    <div onContextMenu={handleClick} className="desktop h-full w-full bg-transparent">
      <MainPlayer />
      <Background />
    </div>
  );
});

function Desktop() {
  const audioContext = useAudioContext();
  const reloadSong = audioContext?.reloadSong;
  const actuallyReloadSong = React.useMemo(() => {
    return () => reloadSong && reloadSong(arguments);
  }, []);

  return <InnerDesktop reloadSong={actuallyReloadSong} />;
}
//Desktop.whyDidYouRender = true;
export default Desktop;
