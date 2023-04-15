import React from "react";
import SongFilterList from "./SongFilterList";
import AlbumArt from "./AlbumArt";
import FilterBar from "./FilterBar";
import Collection from "./Collection";

type Props = {};

function LeftDesktopPanel({}: Props) {
  return (
    <div className="w-1/4 pt-1 h-full flex flex-col justify-between">
      <FilterBar />
      <Collection />
      <AlbumArt></AlbumArt>
    </div>
  );
}

export default LeftDesktopPanel;
