import MainPlayer from "./MainPlayer";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import AppDock from "./AppDock";
import React, { useEffect, useState } from "react";
import { toggleOnTop, Windows } from "../redux/reducers/windowReducer";
import Files from "./Files";
import Info from './Info';
import Projects from "./Projects";
import Resume from "./Resume";

type Props = {};
interface WindowComponents {
  [key: string]: React.ReactElement;
}

function WindowManager({}: Props) {
  const [windowComponents, setWindowComponents] = useState<WindowComponents>({});
  const windows = useSelector((s: RootState) => s.windows.windows);
  const dispatch = useDispatch();

  useEffect(() => {
    setWindowComponents({
      main: <MainPlayer key={"main"} />,
      files: <Files key='files' />,
      info: <Info key='info' />,
      projects: <Projects key='projects' />,
      resume: <Resume key='resume' />
    });
  }, []);

  const hiddenWindows = new Array<string>();
  const windowKeys = Object.keys(windows);
  for (let i = 0; i < windowKeys.length; i++) {
    const window = windows[windowKeys[i]];
    if (windowComponents[windowKeys[i]]) {
      if (window.onTop) hiddenWindows.push(windowKeys[i]);
    }
  }

  const hidden = hiddenWindows.reduce<Windows>((acc: Windows, key: string) => {
    acc[key] = windows[key];
    return acc;
  }, {} as Windows);

  function handleIconClick(_ev: React.MouseEvent, windowName: string) {
    dispatch(toggleOnTop({ name: windowName }));
  }

  return (
    <div className="windowDockManager h-full w-full z-[-10]">
      <div className="absolute activeWindows w-0 h-0">
        {windowComponents &&
          windowKeys
            .filter((key) => windowComponents[key])
            .map((key: string) => windowComponents[key])}
      </div>
      <AppDock handleClick={handleIconClick} windows={hidden} />
    </div>
  );
}

export default WindowManager;
