import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import MyIconButton from "./MyIconButton";
import { Box } from "@mui/material";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StyledSlider from "./StyledSlider";
import TimeseekSlider from "./TimeseekSlider";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import HeadsetOffIcon from "@mui/icons-material/HeadsetOff";
import { useAudioContext } from "./AudioContextProvider";

type Props = {};

function MusicPlayer({}: Props) {
  const { status } = useSelector((s: RootState) => s.settings);
  const [localVolume, setLocalVolume] = useState(5);
  const { hidden } = useSelector((s: RootState) => s.windows["main"]);
  const [iconSx, setIconSx] = useState({ width: "24px", height: "24px" });
  const { URL } = useSelector((s: RootState) => s.global);
  const [lastVolume, setLastVolume] = useState(0);
  const audioContext = useAudioContext();

  function handlePlayPause() {
    fetch(URL + "/api/playpause/", { method: "PUT" });
  }

  function handleLastClick() {
    fetch(URL + "/api/prev", { method: "PUT" });
  }

  function handleNextClick() {
    fetch(URL + "/api/next", { method: "PUT" });
  }

  useEffect(() => {
    if (audioContext && audioContext.audioRef && audioContext.audioRef.current) {
      audioContext.audioRef.current.volume = localVolume / 100;
    }
  }, [localVolume]);

  function handleVolumeChange(_ev: Event, value: number | number[]) {
    if (typeof value === "number") {
      setLocalVolume(value);
    }
  }

  function toggleMute() {
    if (localVolume > 0) {
      setLastVolume(localVolume);
      setLocalVolume(0);
    } else {
      setLocalVolume(lastVolume);
    }
  }

  useEffect(() => {
    const w = hidden ? "16px" : "24px";
    setIconSx({
      height: w,
      width: w,
    });
  }, [hidden]);

  const pausePlayIcon =
    status === "PLAYING" ? <PauseIcon sx={iconSx} /> : <PlayArrowIcon sx={iconSx} />;
  const audioSx = { width: "16px", height: "16px" };
  const audioIcon =
    localVolume === 0 ? <HeadsetOffIcon sx={audioSx} /> : <HeadphonesIcon sx={audioSx} />;

  return (
    <>
      <div
        key={9}
        className={
          "controlPanel w-full h-full bg-neutral border-0 flex items-center shadow-md shadow-base-300 space-x-2 pl-2 pr-2 row-start-4" +
          (hidden ? " !h-[50px]" : "")
        }
      >
        <MyIconButton name="Previous" onClick={handleLastClick}>
          <SkipPreviousIcon sx={iconSx} />
        </MyIconButton>
        <MyIconButton name={status === "PLAYING" ? "Pause" : "Play"} onClick={handlePlayPause}>
          {pausePlayIcon}
        </MyIconButton>
        <MyIconButton name="Previous" onClick={handleNextClick}>
          <SkipNextIcon sx={iconSx} />
        </MyIconButton>
        <TimeseekSlider localVolume={localVolume} />
        <Box className="flex w-[100px] items-center">
          <MyIconButton
            name={localVolume === 0 ? "Unmute" : "Mute"}
            width={25}
            onClick={toggleMute}
          >
            {audioIcon}
          </MyIconButton>
          <StyledSlider
            min={0}
            max={100}
            aria-label="Volume"
            value={localVolume}
            onChange={handleVolumeChange}
            valueLabelDisplay="auto"
            className="bg-base-200"
            size="small"
            sx={{ width: "100%", margin: "0 10px" }}
          />
        </Box>
      </div>
    </>
  );
}
//MusicPlayer.whyDidYouRender = true;
export default MusicPlayer;
