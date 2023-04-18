import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import MyIconButton from "./MyIconButton";
import { Box, IconButton, Slider } from "@mui/material";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

interface WithValue {
  value: number;
}

type Props = {};

function MusicPlayer({}: Props) {
  const audioRef = useRef(null);
  const sourceRef = useRef(null);
  const state = useSelector((s: RootState) => s.songs);
  const { currentSong, startingTime, songs } = state;
  const song = songs[currentSong || 0];
  const dispatch = useDispatch();
  const [localVolume, setLocalVolume] = useState(5);
  const [currentT, setCurrentT] = useState(0);
  const { hidden } = useSelector((s: RootState) => s.windows["main"]);
  const [sharedIconSx, setSharedIconSx] = useState({ width: "24px", height: "24px" });

  function handlePlayPause() {}
  function handleSeek(ev: Event) {
    if (ev instanceof MouseEvent) {
      if ((ev.target as EventTarget & WithValue).value) {
        console.log((ev.target as EventTarget & WithValue).value);
      }
    }
  }

  function handleTimeUpdate(ev: React.SyntheticEvent<HTMLAudioElement, Event>) {
    if (ev.currentTarget) {
      setCurrentT((ev.currentTarget as HTMLAudioElement).currentTime);
    }
  }

  function handleVolumeChange(_ev: Event, value: number | number[]) {
    if (typeof value === "number") {
      setLocalVolume(value);
    }
  }

  useEffect(() => {
    if (currentSong && audioRef.current) {
      (audioRef.current as HTMLAudioElement).src = "/streaming/" + currentSong + ".mp4";
      (audioRef.current as HTMLAudioElement).load();
      (audioRef.current as HTMLAudioElement).currentTime = startingTime / 1000;
      (audioRef.current as HTMLAudioElement).volume = localVolume / 100;
      (audioRef.current as HTMLAudioElement).play();
    }
  }, [startingTime, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      (audioRef.current as HTMLAudioElement).volume = localVolume / 100;
    }
  }, [localVolume, audioRef]);

  useEffect(() => {
    const w = hidden ? "16px" : "24px";
    setSharedIconSx({
      height: w,
      width: w,
    });
  }, [hidden]);

  return (
    <>
      <div
        key={9}
        className={
          "controlPanel w-full h-full bg-base-300 border-0 flex items-center shadow-md shadow-base-300 row-start-4" +
          (hidden ? " !h-[50px]" : "")
        }
      >
        <MyIconButton>
          <SkipPreviousIcon sx={sharedIconSx} />
        </MyIconButton>
        <MyIconButton>
          <PauseIcon sx={sharedIconSx} />
        </MyIconButton>
        <MyIconButton>
          <SkipNextIcon sx={sharedIconSx} />
        </MyIconButton>
        <Box sx={{ display: "flex", flexGrow: 1 }}>
          <Slider
            min={0}
            max={(song && song.duration) || 100}
            value={currentT * 1000}
            onChange={handleSeek}
            className="bg-base-200"
            size="small"
            sx={{ width: "100%", margin: "0 10px" }}
          />
        </Box>
        <Box sx={{ display: "flex", width: "50px" }}>
          <Slider
            min={0}
            max={100}
            value={localVolume}
            onChange={handleVolumeChange}
            className="bg-base-200"
            size="small"
            sx={{ width: "100%", margin: "0 10px" }}
          />
        </Box>
      </div>
      {currentSong && (
        <audio
          onTimeUpdate={(ev) => {
            handleTimeUpdate(ev);
          }}
          controls={false}
          ref={audioRef}
        />
      )}
    </>
  );
}

export default MusicPlayer;
