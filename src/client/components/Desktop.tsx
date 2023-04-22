import React from "react";
import MainPlayer from "./MainPlayer";
import Background from "./Background";

const Desktop = function Desktop() {
  function handleClick(ev: React.MouseEvent) {
    if (
      ev.target instanceof Element &&
      Array.from((ev.target as Element).classList).includes("desktop")
    ) {
      ev.preventDefault();
      console.log("show change background modal");
    }
  }

  return (
    <div onContextMenu={handleClick} className="desktop h-full w-full bg-transparent">
      <MainPlayer />
      <Background />
    </div>
  );
};
//Desktop.whyDidYouRender = true;
export default Desktop;
