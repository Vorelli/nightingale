import MainPlayer from "./MainPlayer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import AppDock from "./AppDock";
import React, { useEffect, useState } from "react";
import { State, toggleOnTop } from "../redux/reducers/windowReducer";

type Props = {};
interface WindowComponents {
  [key: string]: React.ReactElement;
}

function WindowManager({}: Props) {
  const [windowComponents, setWindowComponents] = useState<WindowComponents>({});
  const windows = useSelector((s: RootState) => s.windows);
  const dispatch = useDispatch();

  useEffect(() => {
    setWindowComponents({
      main: <MainPlayer />,
      //  'files': < />,
      //  'info': < />,
      //  'projects': < />,
      //  'resume': < />
    });
  }, []);

  const activeWindows = new Array<string>();
  const hiddenWindows = new Array<string>();
  const windowKeys = Object.keys(windows);
  for (let i = 0; i < windowKeys.length; i++) {
    const window = windows[windowKeys[i]];
    if (windowComponents[windowKeys[i]]) {
      if (window.onTop) hiddenWindows.push(windowKeys[i]);
    }
  }

  const hidden = hiddenWindows.reduce<State>((acc: State, key: string) => {
    acc[key] = windows[key];
    return acc;
  }, {} as State);

  function handleIconClick(ev: React.MouseEvent, windowName: string) {
    dispatch(toggleOnTop({ name: windowName }));
  }

  return (
    <div className="windowDockManager">
      <div className="activeWindows">
        {windowComponents &&
          windowKeys
            .filter((key) => windowComponents[key])
            .map((key: string) => windowComponents[key])}
      </div>
      ,
      <AppDock handleClick={handleIconClick} windows={hidden} />,
    </div>
  );
}

export default WindowManager;
