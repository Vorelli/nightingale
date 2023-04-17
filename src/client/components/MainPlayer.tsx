import React from "react";
import DesktopWindow from "./DesktopWindow";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import LeftDesktopPanel from "./LeftDesktopPanel";
import RightDesktopPanel from "./RightDesktopPanel";
import { toggleHidden, toggleOnTop } from "../redux/reducers/windowReducer";
import BottomDesktopPanel from "./BottomDesktopPanel";
import PlaylistContainer from "./PlaylistContainer";
import CurrentQueueList from "./CurrentQueueList";
import Collection from "./Collection";
import FilterBar from "./FilterBar";
import AlbumArt from "./AlbumArt";
import ControlPanel from "./ControlPanel";

type Props = {};

function MainPlayer({}: Props) {
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
      key={20}
    >
      {[
        !hidden ? (
          <>
            <div key={0} className="collection-container flex flex-col row-start-2 col-start-1">
              <FilterBar />
              <Collection />
            </div>
            <PlaylistContainer key={1} />
            <AlbumArt key={4} />
            <ControlPanel key={3} />
          </>
        ) : (
          <footer key={2} className="w-full h-10">
            Here is the footer (going to be mini player)
          </footer>
        ),
      ]}
    </DesktopWindow>
  );
}

export default MainPlayer;
