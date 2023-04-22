import React from "react";

type Props = { l: number };

function Bar({ l }: Props) {
  return (
    <div
      className="bar flex-1 w-full relative border-[0.5px] border-solid border-secondary"
      style={{ height: l + "px" }}
    />
  );
}

export default Bar;
