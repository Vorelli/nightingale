import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import StyledSlider from "./StyledSlider";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { AudioContextState, useAudioContext } from "./AudioContextProvider";
import { secondsToTime } from "../helpers/time";
import { TimeseekContextState, useTimeseekContext } from "./TimeseekContextProvider";

type OriginalProps = { localVolume: number };
type Props = {
  localVolume: number;
  audioRef: React.MutableRefObject<HTMLAudioElement | null> | undefined;
  movingTime: boolean | undefined;
  currentT: number | undefined;
  setMovingTime: undefined | Function;
  setCurrentT: undefined | Function;
};

const TimeseekSliderInner = React.memo(function TimeseekSlider({
  localVolume,
  movingTime,
  audioRef,
  currentT,
  setMovingTime,
  setCurrentT,
}: Props) {
  const state = useSelector((s: RootState) => s.songs);
  const { currentSong, startingTime, songs } = state;
  const song = songs[currentSong || 0];
  const { URL } = useSelector((s: RootState) => s.global);
  const [sharedSliderClass, _setSharedSliderClass] = useState(
    "bg-gradient-to-r from-secondary via-accent to-secondary"
  );

  useEffect(() => {
    if (!!audioRef && audioRef.current && !movingTime) {
      (audioRef.current as HTMLAudioElement).volume = localVolume / 100;
    }
  }, [localVolume, audioRef, startingTime, currentSong]);

  function handleSeek(_: any) {
    fetch(URL + "/api/time" + "?newTime=" + (currentT || 1) * Math.pow(10, 9), {
      method: "PUT",
    });
    setMovingTime && setMovingTime(false);
  }

  function handleTimeChange(ev: Event, value: number | number[]) {
    setMovingTime && setMovingTime(true);
    typeof value === "number"
      ? setCurrentT && setCurrentT(value, "handleTimeChange type number")
      : setCurrentT && setCurrentT(value[0], "handleTimeChange type array");
  }

  return (
    <Box sx={{ display: "flex", flexGrow: 1 }}>
      <StyledSlider
        min={0}
        aria-label="seekSlider"
        max={(song && song.duration / 1000) || 100}
        value={currentT}
        onChange={handleTimeChange}
        onMouseUp={handleSeek}
        onKeyUp={(ev: React.KeyboardEvent) => {
          if (ev.key === " " || ev.key === "Enter") {
            handleSeek(ev);
          } else if (ev.key === "Escape") {
            setMovingTime && setMovingTime(false);
          }
          ev.currentTarget.dispatchEvent(new Event("focusout"));
        }}
        className={sharedSliderClass}
        valueLabelDisplay="auto"
        valueLabelFormat={secondsToTime}
        size="small"
        sx={{ width: "100%", margin: "0 10px" }}
      />
    </Box>
  );
});

function TimeseekSlider({ localVolume }: OriginalProps) {
  const timeseekContext = useTimeseekContext();
  const audioContext = useAudioContext();
  const setCurrentT = timeseekContext?.setCurrentT;
  const setMovingTime = timeseekContext?.setMovingTime;

  const actuallySetCurrentT = React.useMemo(() => {
    return (num: number) => {
      setCurrentT && setCurrentT(num, "from actuallySetCurrentT react memo");
    };
  }, []);

  const actuallySetMovingTime = React.useMemo(() => {
    return (val: boolean) => {
      setMovingTime && setMovingTime(val);
    };
  }, []);

  return (
    <TimeseekSliderInner
      localVolume={localVolume}
      audioRef={audioContext?.audioRef}
      currentT={timeseekContext?.currentT}
      movingTime={timeseekContext?.movingTime}
      setCurrentT={actuallySetCurrentT}
      setMovingTime={actuallySetMovingTime}
    />
  );
}

TimeseekSlider.whyDidYouRender = false;
export default TimeseekSlider;
