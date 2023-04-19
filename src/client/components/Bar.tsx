import React from "react";

type Props = { l: number };

const movingRainbowBorder =
  " rainbowBorder bg-gradient-to-r before:content[''] before:z-[-5] z-10 border-transparent border-2 border-solid border-accent before:w-full before:bg-base-100 before:absolute before:h-full before:top-0 before:left-0 box-border";

function Bar({ l }: Props) {
  return (
    <div
      className={
        "bar flex-1 w-full relative border-[0.5px] border-solid border-secondary"
        //.movingRainbowBorder
      }
      style={{ height: l + "px" }}
    />
  );
}

export default Bar;
