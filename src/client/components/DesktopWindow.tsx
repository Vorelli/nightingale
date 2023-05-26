import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "./HeaderBar";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { AppDispatch } from "../redux/store";
import {
  handleDragStart,
  toggleHidden,
  toggleOnTop,
} from "../redux/reducers/windowReducer";

interface Position {
  x: number;
  y: number;
}

interface Dimensions {
  w: number;
  h: number;
}
const minBound = 10;

const DesktopWindow = (props: {
  title?: string;
  id?: string;
  children: React.ReactElement[];
  storeName: string;
}) => {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const container = useRef(null);
  const dispatch: AppDispatch = useDispatch();
  const { onTop, hidden } = useSelector(
    (s: RootState) => s.windows.windows[props.storeName]
  );
  const order = useSelector((s: RootState) =>
    s.windows.windowOrder.indexOf(props.storeName)
  );
  console.log("order:", order);
  const [fixedPos, setFixedPos] = useState<undefined | Position>({
    x: windowWidth - width - minBound,
    y: windowHeight - height - minBound,
  });

  useEffect(() => {
    const dims = getWidthAndHeight();
    setHeight(dims.h);
    setWidth(dims.w);
  }, [hidden]);

  useEffect(() => {
    setFixedPos((pos: Position | undefined): Position | undefined => {
      if (pos === undefined) return undefined;
      const dims = getWidthAndHeight();
      const tempX = Math.max(10, windowWidth - dims.w - minBound);
      const x =
        pos.x + dims.w < windowWidth - minBound * 2 && pos.x >= minBound
          ? pos.x
          : tempX;
      const tempY = Math.max(10, windowHeight - dims.h - minBound);
      const y =
        pos.y + dims.h < windowHeight - minBound * 2 && pos.y >= minBound
          ? pos.y
          : tempY;
      return x === pos.x && y === pos.y ? pos : { x, y };
    });
  }, [fixedPos, width, height, windowHeight, windowWidth]);

  useEffect(() => {
    function handleResize() {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  function getWidthAndHeight(): Dimensions {
    return {
      w: hidden ? 400 : 800,
      h: hidden ? 110 : 600,
    };
  }

  return (
    (!onTop && (
      <Draggable
        bounds={{
          left: 10,
          top: 10,
          right: windowWidth - width - 10,
          bottom: windowHeight - height - 10,
        }}
        position={fixedPos}
        onDrag={(ev: DraggableEvent) => {
          if (ev.target instanceof Element) {
          }
        }}
        onStart={(_ev: DraggableEvent) => {
          setFixedPos(undefined);
          dispatch(handleDragStart({ name: props.storeName }));
        }}
        onStop={(_ev: DraggableEvent, data: DraggableData) => {
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
            // (onTop ? "opacity-0 pointer-events-none " : "pointer-events-auto opacity-100 ") +
            (hidden ? "small text-sm" : "big text-md") +
            " pointer-events-auto absolute desktopWindow bg-gradient-to-r before:z-[-1] z-[" +
            (1 + order) +
            "] from-primary via-secondary to-primary transition-[height] border-transparent border-2 border-solid border-accent before:w-full before:bg-base-100 before:absolute before:h-full before:left-0 box-border p-2 pt-0 grid" // drop-shadow-md shadow drop-shadow-accent shadow-accent"
          }
          ref={container}
        >
          <header
            className={
              (hidden ? "space-x-0.5 " : "space-x-2 ") +
              "w-full h-12 flex justify-between box-border items-center select-none col-span-2"
            }
          >
            <div
              className={
                "flex-1 flex justify-start items-center mt-2 h-10 header hover:cursor-move" +
                (hidden ? " space-x-2 text-sm" : " space-x-4 ")
              }
            >
              <div className="min-w-[40px] max-w-[40px] bg-base-200 mask mask-circle h-full">
                <img
                  alt="Nightingale Logo"
                  draggable={false}
                  className="w-8 h-8 relative left-1 top-1"
                  src={"/icons/" + props.storeName + ".png"}
                />
              </div>
              <h1 className="justify-start h-full overflow-y-auto">
                {props.title || "Default Title"}
              </h1>
            </div>
            <HeaderBar
              storeName={props.storeName}
              onShowHideClick={() =>
                dispatch(toggleHidden({ name: props.storeName }))
              }
              onMoveToTopClick={() =>
                dispatch(toggleOnTop({ name: props.storeName }))
              }
            />
          </header>
          {props.children}
        </section>
      </Draggable>
    )) || <></>
  );
};

export default DesktopWindow;
