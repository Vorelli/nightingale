import React from "react";
import DesktopWindow from "./DesktopWindow";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import PlaylistContainer from "./PlaylistContainer";
import Collection from "./Collection";
import FilterBar from "./FilterBar";
import AlbumArt from "./AlbumArt";
import MusicPlayer from "./MusicPlayer";
import FirstTimeButton from "./FirstTimeButton";

const MainPlayer = function MainPlayer() {
  const windowName = "main";
  const { hidden } = useSelector((s: RootState) => s.windows.windows[windowName]);
  const { currentSong, songs } = useSelector((s: RootState) => s.songs);
  const { status } = useSelector((s: RootState) => s.settings);
  const { audioPlayable } = useSelector((s: RootState) => s.global);
  const song = songs[currentSong || 0];

  return (
    <DesktopWindow
      title={
        "Nightingale " +
          status +
          " " +
          (song &&
            song.albumArtist &&
            song.albumArtist + " - " + song.albumName + " - " + song.name) || "Loading..."
      }
      storeName={windowName}
      id="main-player"
    >
      {(!audioPlayable && <FirstTimeButton />) || <></>}
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
