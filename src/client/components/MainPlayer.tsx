import React, { useState } from "react";
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

const MainPlayer = function MainPlayer() {
  const windowName = "main";
  const { hidden } = useSelector((s: RootState) => s.windows[windowName]);

  return (
    <DesktopWindow
      icon={"/icon.png"}
      title={"Nightingale Playing <anim> The Mountain Goats - Tallahassee - No Children"}
      storeName={windowName}
      toggleHidden={toggleHidden}
      toggleOnTop={toggleOnTop}
      id="main-player"
    >
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
MainPlayer.whyDidYouRender = true;
export default MainPlayer;
