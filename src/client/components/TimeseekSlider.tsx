import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import StyledSlider from "./StyledSlider";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useAudioContext } from "./AudioContextProvider";
import { secondsToTime } from "../helpers/time";

type Props = { localVolume: number };

function TimeseekSlider({ localVolume }: Props) {
  const state = useSelector((s: RootState) => s.songs);
  const { currentSong, startingTime, songs } = state;
  const song = songs[currentSong || 0];
  const { URL } = useSelector((s: RootState) => s.global);
  const [sharedSliderClass, _setSharedSliderClass] = useState(
    "bg-gradient-to-r from-secondary via-accent to-secondary"
  );
  const context = useAudioContext();
  const audioRef = context?.audioRef;

  useEffect(() => {
    if (!!audioRef && audioRef.current && !context.movingTime) {
      (audioRef.current as HTMLAudioElement).volume = localVolume / 100;
    }
  }, [localVolume, audioRef]);

  useEffect(() => {
    if (context && currentSong && !!audioRef && audioRef.current) {
      const audio = audioRef.current as HTMLAudioElement;
      const currentSrc = audio.src;
      const indexOfStreaming = currentSrc.indexOf("/streaming/");
      if (indexOfStreaming === -1 || currentSong !== currentSrc.slice(indexOfStreaming + 11, -4)) {
        const newSrc = URL + "/streaming/" + currentSong + ".mp4";
        console.log("src", newSrc);
        audio.crossOrigin = "anonymous";
        audio.src = newSrc;
        audio.load();
      }
      audio.currentTime = startingTime / 1000;
      audio.volume = localVolume / 100;
    }
  }, [startingTime, currentSong]);

  function handleSeek(_: any) {
    fetch(URL + "/api/time" + "?newTime=" + (context?.currentT || 1) * Math.pow(10, 9), {
      method: "PUT",
    });
    context?.setMovingTime(false);
  }

  function handleTimeChange(ev: Event, value: number | number[]) {
    context?.setMovingTime(true);
    typeof value === "number" ? context?.setCurrentT(value) : context?.setCurrentT(value[0]);
  }

  return (
    <Box sx={{ display: "flex", flexGrow: 1 }}>
      <StyledSlider
        min={0}
        aria-label="seekSlider"
        max={(song && song.duration / 1000) || 100}
        value={context?.currentT}
        onChange={handleTimeChange}
        onMouseUp={handleSeek}
        onKeyUp={(ev: React.KeyboardEvent) => {
          if (ev.key === " " || ev.key === "Enter") {
            handleSeek(ev);
          } else if (ev.key === "Escape") {
            context?.setMovingTime(false);
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
}
TimeseekSlider.whyDidYouRender = true;
export default TimeseekSlider;
