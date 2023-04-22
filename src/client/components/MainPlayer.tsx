import React, { useEffect, useState } from "react";
import DesktopWindow from "./DesktopWindow";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import RightDesktopPanel from "./RightDesktopPanel";
import { toggleHidden, toggleOnTop } from "../redux/reducers/windowReducer";
import BottomDesktopPanel from "./BottomDesktopPanel";
import PlaylistContainer from "./PlaylistContainer";
import CurrentQueueList from "./CurrentQueueList";
import Collection from "./Collection";
import FilterBar from "./FilterBar";
import AlbumArt from "./AlbumArt";
import MusicPlayer from "./MusicPlayer";
import TitleAnimation from "./TitleAnimation";
import { useAudioContext } from "./AudioContextProvider";
import MyIconButton from "./MyIconButton";
import { PlayArrowOutlined } from "@mui/icons-material";
import { setReloadSong } from "../redux/reducers/globalReducer";

const MainPlayer = function MainPlayer() {
  const windowName = "main";
  const { hidden } = useSelector((s: RootState) => s.windows[windowName]);
  const { currentSong, songs } = useSelector((s: RootState) => s.songs);
  const { status } = useSelector((s: RootState) => s.settings);
  const { audioPlayable } = useSelector((s: RootState) => s.global);
  const song = songs[currentSong || 0];
  const audioContext = useAudioContext();
  const audio = audioContext?.audioRef;
  const dispatch = useDispatch();

  /*useEffect(() => {
    console.log("audioContext", audioContext?.audioRef?.current);
    if (!audioContext?.audioRef?.current) return;
    try {
      console.log("trying to play in the next second");
      const audio = audioContext.audioRef.current as HTMLAudioElement;
      audio.muted = true;
      audio
        .play()
        .then(() => audio.pause())
        .then(() => console.log("got to the next line successfully"))
        .then(() => (audio.muted = false))
        .catch((err) => console.log("error encountered when trying to play audio", err));
    } catch (err) {
      console.log("no permission", err);
      console.log("error occurred when trying to force play the audio component");
    }
  }, [audioContext]); */

  function tryToPlay() {
    if (!audio || !audio.current) return;
    else {
      const a = audio.current as HTMLAudioElement;
      a.muted = true;
      a.play()
        .then(() => dispatch(setReloadSong(true)))
        .finally(() => (a.muted = false));
    }
  }

  return (
    <DesktopWindow
      icon={"/icon.png"}
      title={
        "Nightingale " +
          status +
          //" " +
          //<TitleAnimation /> +
          " " +
          (song &&
            song.albumArtist &&
            song.albumArtist + " - " + song.albumName + " - " + song.name) || "Loading..."
      }
      storeName={windowName}
      toggleHidden={toggleHidden}
      toggleOnTop={toggleOnTop}
      id="main-player"
    >
      {(!audioPlayable && (
        <div className="content-[''] bg-black z-50 absolute w-full h-full flex items-center justify-center">
          <MyIconButton onClick={tryToPlay}>
            <PlayArrowOutlined />
          </MyIconButton>
        </div>
      )) || <></>}
      {(!hidden && (
        <div className="collection-container flex flex-col row-start-2 col-start-1">
          <FilterBar />
          <Collection />
        </div>
      )) || <></>}
      {(!hidden && <PlaylistContainer />) || <></>}
      <AlbumArt />
      <MusicPlayer />
    </DesktopWindow>
  );
};
//MainPlayer.whyDidYouRender = true;
export default MainPlayer;
