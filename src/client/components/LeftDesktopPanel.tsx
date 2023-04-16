import React from "react";
import FilterBar from "./FilterBar";
import Collection from "./Collection";

type Props = {};

function LeftDesktopPanel({}: Props) {
  return (
    <div className="w-1/5 flex-1 pt-1 h-full flex flex-col justify-between">
      <FilterBar />
      <Collection />
    </div>
  );
}

export default LeftDesktopPanel;
