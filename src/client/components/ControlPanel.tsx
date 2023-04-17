import { Box, IconButton, Slider } from "@mui/material";
import React, { MouseEvent } from "react";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import MyIconButton from "./MyIconButton";
type Props = {};

interface WithValue {
  value: number;
}

function ControlPanel({}: Props) {
  const { currentSong } = useSelector((s: RootState) => s.songs);
  const [currentTime, setCurrentTime] = React.useState(0);

  function handlePlayPause() {}
  function handleSeek(ev: Event) {
    if (ev instanceof MouseEvent) {
      if ((ev.target as EventTarget & WithValue).value) {
        console.log((ev.target as EventTarget & WithValue).value);
      }
    }
  }

  return (
    <div
      key={9}
      className="controlPanel w-full h-full bg-base-300 border-0 flex items-center shadow-md shadow-base-300"
    >
      {currentSong && (
        <audio
          onTimeUpdate={(ev) => setCurrentTime(ev.currentTarget.currentTime)}
          controls={false}
          autoPlay
        >
          <source src={"/streaming/" + currentSong.md5 + ".mp4"} type="audio/mpeg" />
        </audio>
      )}
      <MyIconButton>
        <SkipPreviousIcon />
      </MyIconButton>
      <MyIconButton>
        <PauseIcon />
      </MyIconButton>
      <MyIconButton>
        <SkipNextIcon />
      </MyIconButton>
      <MyIconButton>
        <StopIcon />
      </MyIconButton>
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <Slider
          min={0}
          max={(currentSong && currentSong.duration) || 100}
          value={currentTime}
          onChange={handleSeek}
          className="bg-primary"
          sx={{ width: "100%", margin: "0 10px" }}
        />
      </Box>
    </div>
  );
}

export default ControlPanel;
