import React from "react";
import SongFilterList from "./SongFilterList";
import AlbumArt from "./AlbumArt";

type Props = {};

function LeftDesktopPanel({}: Props) {
  return (
    <div className="w-1/4 pt-1 h-full">
      <SongFilterList></SongFilterList>
      <AlbumArt></AlbumArt>
    </div>
  );
}

export default LeftDesktopPanel;
