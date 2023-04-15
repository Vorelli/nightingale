import React from "react";
import FilterBar from "./FilterBar";
import Collection from "./Collection";

type Props = {};

function SongFilterList({}: Props) {
  return (
    <div className="flex flex-col">
      <FilterBar />
      <Collection />
    </div>
  );
}

export default SongFilterList;
