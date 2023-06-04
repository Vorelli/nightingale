import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import MyIconButton from "./MyIconButton";
import { Box } from "@mui/material";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import StyledSlider from "./StyledSlider";
import TimeseekSlider from "./TimeseekSlider";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import HeadsetOffIcon from "@mui/icons-material/HeadsetOff";
import { useAudioContext } from "./AudioContextProvider";
import PlayPauseButton from "./PlayPauseButton";

type Props = {
  audioRef: React.MutableRefObject<HTMLAudioElement | null> | undefined;
};

const MusicPlayerInner = React.memo(function MusicPlayer({ audioRef }: Props) {
  const [localVolume, actuallySetLocalVolume] = useState(loadVolume());
  const { hidden } = useSelector((s: RootState) => s.windows.windows["main"]);
  const [iconSx, setIconSx] = useState({ width: "24px", height: "24px" });
  const { URL } = useSelector((s: RootState) => s.global);
  const [lastVolume, setLastVolume] = useState(0);

  function handleLastClick() {
    fetch(URL + "/api/prev", { method: "PUT" });
  }

  function handleNextClick() {
    fetch(URL + "/api/next", { method: "PUT" });
  }

  function setLocalVolume(num: number) {
    actuallySetLocalVolume(num);
    localStorage.setItem("volume", num + "");
    if (audioRef && audioRef.current) {
      audioRef.current.volume = num / 100;
    }
  }

  useEffect(() => {
    if (!!audioRef && audioRef.current) {
      (audioRef.current as HTMLAudioElement).volume = localVolume / 100;
    }
  }, [localVolume, audioRef]);

  function loadVolume(): number {
    let loaded = localStorage.getItem("volume");
    if (loaded === null) loaded = "5";
    const parsed = parseInt(loaded);
    if (Number.isNaN(parsed)) {
      return 5;
    } else if (parsed < 0) {
      return 0;
    } else if (parsed > 100) {
      return 100;
    } else {
      return parsed;
    }
  }

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
    setIconSx((cur) => {
      return cur.height === w
        ? cur
        : {
            height: w,
            width: w,
          };
    });
  }, [hidden]);

  const [audioSx, _] = React.useState({ width: "16px", height: "16px" });
  const audioIcon =
    localVolume === 0 ? (
      <HeadsetOffIcon sx={audioSx} />
    ) : (
      <HeadphonesIcon sx={audioSx} />
    );

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
        <PlayPauseButton />
        <MyIconButton name="Previous" onClick={handleNextClick}>
          <SkipNextIcon sx={iconSx} />
        </MyIconButton>
        <TimeseekSlider />
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
});

function MusicPlayer() {
  const audioContext = useAudioContext();
  return <MusicPlayerInner audioRef={audioContext?.audioRef} />;
}

export default MusicPlayer;
