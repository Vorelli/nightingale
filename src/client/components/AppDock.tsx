import React, { useEffect, useState } from "react";
import type { Windows } from "../redux/reducers/windowReducer.js";

interface Props {
  windows: Windows;
  handleClick: (ev: React.MouseEvent, windowName: string) => void;
}

interface StyleLeftTop {
  left: number;
  top: number;
}

const AppDock = ({ windows, handleClick }: Props) => {
  const [icons, setIcons] = useState<JSX.Element[]>([]);
  const radius = 200;
  const zeroPos = { x: 80, y: 0 };
  const len = 32;

  useEffect(() => {
    setIcons(
      Object.keys(windows).map((windowName: string, i: number) => {
        return (
          <div
            key={windowName}
            onClick={(ev) => handleClick(ev, windowName)}
            className="transition-all animate-in slide-in-from-top-10 duration-300 bg-base-300 h-10 w-10 mask mask-circle absolute"
            style={calculatePos(i, windows)}
          >
            <img
              className="h-8 object-cover w-8 m-1 bg-transparent relative"
              src={"/icons/" + windowName + ".png"}
            />
          </div>
        );
      })
    );
  }, [windows]);

  function calculatePos(i: number, windows: Windows): StyleLeftTop {
    const length = Object.keys(windows).length;
    const middle = Math.floor(length / 2);
    const diff = middle - i;
    const quantity = i < middle ? -diff : Math.abs(diff) + +(length % 2 === 0);
    const angle = 90 + 15 * quantity;
    const x = zeroPos.x - len / 2 + radius * Math.cos(angle * (Math.PI / 180));
    const y = zeroPos.y - len / 2 + radius * Math.sin(angle * (Math.PI / 180));
    return { left: x, top: y };
  }

  return (
    <div className="absolute w-full h-[160px] flex flex-col items-center justify-start">
      <div className="appDock relative w-40 h-[160px] top-[-80px] pointer-events-auto rounded-full m-auto bg-base-200">
        {icons}
      </div>
    </div>
  );
};
export default AppDock;
