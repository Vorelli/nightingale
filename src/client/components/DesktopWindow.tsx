import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import HeaderBar from "./HeaderBar";
import Draggable, { DraggableEvent } from "react-draggable";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { AppDispatch } from "../redux/store";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";

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

  window.onresize = (ev: UIEvent) => {
    setWindowHeight(window.innerHeight);
    setWindowWidth(window.innerWidth);
  };

  useEffect(() => {
    setHeight(hidden ? 100 : 400);
  }, [hidden]);

  return (
    <Draggable
      bounds={{
        left: 5,
        top: 5,
        right: windowWidth - width - 5,
        bottom: windowHeight - height - 5,
      }}
      defaultPosition={{ x: 50, y: 50 }}
      onDrag={(ev: DraggableEvent) => {
        if (ev.target instanceof Element) {
        }
      }}
      handle=".header"
    >
      <section
        style={{ width, height }}
        id={props.id}
        className={
          (hidden ? "small" : "big") +
          " transition-[height] border-[1px] border-solid border-accent box-border drop-shadow-md shadow drop-shadow-accent shadow-accent p-2 pt-0 grid"
        }
        ref={container}
      >
        <header className="w-full h-10 flex justify-between box-border items-center select-none col-span-2">
          <div className="flex-1 flex justify-start space-x-2 items-center pt-2 header hover:cursor-move">
            <div className="w-10 h-10 bg-base-200 mask mask-circle">
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
