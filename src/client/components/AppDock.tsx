import type { State } from "../redux/reducers/windowReducer.js";
import React from "react";

interface Props {
  windows: State;
}

const AppDock = ({ windows }: Props) => {
  return (
    <div className="appDock">
      {Object.keys(windows).map((windowName: string) => {
        return (
          <div className="h-8 w-8">
            <img src="https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcQkrjYxSfSHeCEA7hkPy8e2JphDsfFHZVKqx-3t37E4XKr-AT7DML8IwtwY0TnZsUcQ" />
          </div>
        );
      })}
    </div>
  );
};
export default AppDock;
