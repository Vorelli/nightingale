import React, { memo, useEffect, useRef, useState } from "react";
import DesktopWindow from "./DesktopWindow";
import MainPlayer from "./MainPlayer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setCurrentTime } from "../redux/reducers/songsReducer";

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
    <div onContextMenu={handleClick} className="desktop h-full w-full bg-base-100">
      <MainPlayer />
    </div>
  );
};
//Desktop.whyDidYouRender = true;
export default Desktop;
