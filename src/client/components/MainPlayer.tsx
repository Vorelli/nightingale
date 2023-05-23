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
import FirstTimeButton from "./FirstTimeButton";

const MainPlayer = function MainPlayer() {
  const windowName = "main";
  const { hidden } = useSelector((s: RootState) => s.windows[windowName]);
  const { currentSong, songs } = useSelector((s: RootState) => s.songs);
  const { status } = useSelector((s: RootState) => s.settings);
  const { audioPlayable } = useSelector((s: RootState) => s.global);
  const song = songs[currentSong || 0];

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
