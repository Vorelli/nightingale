import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import HeaderBar from "./HeaderBar";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { AppDispatch } from "../redux/store";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";

interface Position {
  x: number;
  y: number;
}

const DesktopWindow = (props: {
  title?: string;
  id?: string;
  children: React.ReactElement[];
  icon: string;
  storeName: string;
  toggleHidden: ActionCreatorWithPayload<any, "windows/toggleHidden">;
  toggleOnTop: ActionCreatorWithPayload<any, "windows/toggleOnTop">;
}) => {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const container = useRef(null);
  const dispatch: AppDispatch = useDispatch();
  const { onTop, hidden } = useSelector((s: RootState) => s.windows[props.storeName]);
  const [fixedPos, setFixedPos] = useState<undefined | Position>(undefined);

  window.onresize = (ev: UIEvent) => {
    setWindowHeight(window.innerHeight);
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    setHeight(hidden ? 110 : 600);
    setWidth(hidden ? 400 : 800);
  }, [hidden]);

  return (
    <Draggable
      bounds={{
        left: 5,
        top: 5,
        right: windowWidth - width - 5,
        bottom: windowHeight - height - 5,
      }}
      position={fixedPos}
      defaultPosition={{ x: 50, y: 50 }}
      onDrag={(ev: DraggableEvent) => {
        if (ev.target instanceof Element) {
        }
      }}
      onStart={(ev: DraggableEvent) => {
        setFixedPos(undefined);
      }}
      onStop={(ev: DraggableEvent, data: DraggableData) => {
        const newX = Math.round(data.x / 10) * 10;
        const newY = Math.round(data.y / 10) * 10;
        setFixedPos({ x: newX, y: newY });
      }}
      key="main"
      handle=".header"
    >
      <section
        style={{ width, height }}
        id={props.id}
        className={
          (hidden ? "small text-sm" : "big text-md") +
          //+" bg-gradient-to-r from-primary via-secondary to-primary hover:before:bg-transparent !text-base-content transition-all before:transition-all before:rounded-full !relative hover:!bg-primary !z-10 before:z-[-10] !border-solid !border-[1px] !border-transparent before:w-full before:bg-base-100 before:absolute before:h-full before:left-0 !rounded-full !p-0"
          " relative desktopWindow bg-gradient-to-r before:z-[-5] from-primary via-secondary to-primary transition-[height] border-transparent border-2 border-solid border-accent before:w-full before:bg-base-100 before:absolute before:h-full before:left-0 box-border p-2 pt-0 grid" // drop-shadow-md shadow drop-shadow-accent shadow-accent"
        }
        ref={container}
      >
        <header
          className={
            (hidden ? "space-x-0.5 " : "space-x-2 ") +
            "w-full h-10 flex justify-between box-border items-center select-none col-span-2"
          }
        >
          <div
            className={
              "flex-1 flex justify-start items-center pt-2 header hover:cursor-move" +
              (hidden ? " space-x-2 text-sm" : " space-x-4 ")
            }
          >
            <div className="min-w-[40px] max-w-[40px] h-10 bg-base-200 mask mask-circle">
              <img draggable={false} className="w-8 h-8 relative left-1 top-1" src={props.icon} />
            </div>
            <h1 className="justify-start">{props.title || "Default Title"}</h1>
          </div>
          <HeaderBar
            storeName={props.storeName}
            onShowHideClick={() => dispatch(props.toggleHidden({ name: props.storeName }))}
            onMoveToTopClick={() => dispatch(props.toggleOnTop({ name: props.storeName }))}
          />
        </header>
        {props.children}
      </section>
    </Draggable>
  );
};

export default DesktopWindow;
