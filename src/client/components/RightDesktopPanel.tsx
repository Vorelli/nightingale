import React from "react";
import PlaylistContainer from "./PlaylistContainer";
import CurrentQueueList from "./CurrentQueueList";

type Props = {};

function RightDesktopPanel({}: Props) {
  return (
    <div className="w-3/4 pt-1 h-full flex flex-col justify-start">
      <PlaylistContainer />
      <CurrentQueueList />
    </div>
  );
}

export default RightDesktopPanel;
