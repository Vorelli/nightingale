import React, { useState } from "react";
import MyIconButton from "./MyIconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type Props = {};

function PlayPauseButton({}: Props) {
  const { status } = useSelector((s: RootState) => s.settings);
  const { URL } = useSelector((s: RootState) => s.global);
  function handlePlayPause() {
    fetch(URL + "/api/playpause/", { method: "PUT" });
  }

  const [iconSx, setIconSx] = useState({ width: "24px", height: "24px" });
  const pausePlayIcon =
    status === "PLAYING" ? <PauseIcon sx={iconSx} /> : <PlayArrowIcon sx={iconSx} />;

  return (
    <MyIconButton name={status === "PLAYING" ? "Pause" : "Play"} onClick={handlePlayPause}>
      {pausePlayIcon}
    </MyIconButton>
  );
}

export default PlayPauseButton;
