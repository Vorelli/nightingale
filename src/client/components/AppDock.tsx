import React, { MouseEventHandler } from "react";
import type { State } from "../redux/reducers/windowReducer.js";

interface Props {
  windows: State;
  handleClick: (ev: React.MouseEvent, windowName: string) => void;
}

const AppDock = ({ windows, handleClick }: Props) => {
  console.log("windows:", windows);
  return (
    <div className="appDock">
      {Object.keys(windows).map((windowName: string) => {
        return (
          <div key={windowName} onClick={(ev) => handleClick(ev, windowName)} className="h-8 w-8">
            <img src="https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcQkrjYxSfSHeCEA7hkPy8e2JphDsfFHZVKqx-3t37E4XKr-AT7DML8IwtwY0TnZsUcQ" />
          </div>
        );
      })}
    </div>
  );
};
export default AppDock;
