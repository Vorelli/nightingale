import React, { useEffect, useState } from "react";
import MyIconButton from "./MyIconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type Props = {};

function PlayPauseButton({}: Props) {
  const { status } = useSelector((s: RootState) => s.settings);
  const { URL } = useSelector((s: RootState) => s.global);
  const { hidden } = useSelector((s: RootState) => s.windows.windows["main"]);
  function handlePlayPause() {
    fetch(URL + "/api/playpause/", { method: "PUT" });
  }

  const [iconSx, setIconSx] = useState({ width: "24px", height: "24px" });
  useEffect(() => {
    const l = hidden ? "16px" : "24px";
    setIconSx((cur) =>
      cur.height !== l
        ? {
            width: l,
            height: l,
          }
        : cur
    );
  }, [hidden]);
  const pausePlayIcon =
    status === "PLAYING" ? (
      <PauseIcon sx={iconSx} />
    ) : (
      <PlayArrowIcon sx={iconSx} />
    );

  return (
    <MyIconButton
      name={status === "PLAYING" ? "Pause" : "Play"}
      onClick={handlePlayPause}
    >
      {pausePlayIcon}
    </MyIconButton>
  );
}

export default PlayPauseButton;
