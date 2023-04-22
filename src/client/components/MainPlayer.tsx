import React from "react";
import DesktopWindow from "./DesktopWindow";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { toggleHidden, toggleOnTop } from "../redux/reducers/windowReducer";
import PlaylistContainer from "./PlaylistContainer";
import Collection from "./Collection";
import FilterBar from "./FilterBar";
import AlbumArt from "./AlbumArt";
import MusicPlayer from "./MusicPlayer";
import { useAudioContext } from "./AudioContextProvider";
import MyIconButton from "./MyIconButton";
import { Label, PlayArrowOutlined } from "@mui/icons-material";
import { setReloadSong } from "../redux/reducers/globalReducer";
import { Button } from "@mui/material";

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
        <div className="content-[''] bg-black z-50 absolute w-full h-full flex items-center justify-center flex-col">
          <MyIconButton width={100} onClick={tryToPlay}>
            <PlayArrowOutlined sx={{ width: "50px", height: "50px" }} />
          </MyIconButton>
          <a
            target="_blank"
            href="https://www.tenforums.com/tutorials/116467-allow-block-sites-play-sound-google-chrome.html#option4"
          >
            <Button sx={{ textDecoration: "underline" }}>How To Disable Pop Up</Button>
          </a>
          <p>Please set Audio to Allow</p>
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
