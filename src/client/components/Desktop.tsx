import React, { memo, useEffect, useRef, useState } from "react";
import DesktopWindow from "./DesktopWindow";
import MainPlayer from "./MainPlayer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setCurrentTime } from "../redux/reducers/songsReducer";

const Desktop = function Desktop() {
  return (
    <div className="h-full w-full bg-base-100">
      <MainPlayer />
    </div>
  );
};
Desktop.whyDidYouRender = true;
export default Desktop;
