import React from "react";
import type { State } from "../redux/reducers/windowReducer.js";

interface Props {
  windows: State;
  handleClick: (ev: React.MouseEvent, windowName: string) => void;
}

const AppDock = ({ windows, handleClick }: Props) => {
  return (
    <div className="absolute w-full h-10 flex flex-col items-center justify-start">
      <div className="appDock relative top-5 w-20 h-10 rounded-md m-auto bg-base-200">
        {Object.keys(windows).map((windowName: string) => {
          return (
            <div
              key={windowName}
              onClick={(ev) => handleClick(ev, windowName)}
              className="h-8 w-8 z-20 relative pointer-events-auto"
            >
              <img src="https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcQkrjYxSfSHeCEA7hkPy8e2JphDsfFHZVKqx-3t37E4XKr-AT7DML8IwtwY0TnZsUcQ" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default AppDock;
