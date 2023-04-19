import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import StyledSlider from "./StyledSlider";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type Props = { localVolume: number };

function TimeseekSlider({ localVolume }: Props) {
  const audioRef = useRef(null);
  const state = useSelector((s: RootState) => s.songs);
  const { status } = useSelector((s: RootState) => s.settings);
  const { currentSong, startingTime, songs, currentSongLoading } = state;
  const song = songs[currentSong || 0];
  const [currentT, setCurrentT] = useState(0);
  const { URL } = useSelector((s: RootState) => s.global);
  const [sharedSliderClass, _setSharedSliderClass] = useState(
    "bg-gradient-to-r from-secondary via-accent to-secondary"
  );
  const [movingTime, setMovingTime] = useState(false);

  useEffect(() => {
    if (audioRef.current && !movingTime) {
      (audioRef.current as HTMLAudioElement).volume = localVolume / 100;
    }
  }, [localVolume, audioRef]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audio = audioRef.current as HTMLAudioElement;
      audio.src = "/streaming/" + currentSong + ".mp4";
      audio.load();
      audio.currentTime = startingTime / 1000;
      audio.volume = localVolume / 100;
    }
  }, [startingTime, currentSong]);

  useEffect(() => {
    if (!currentSongLoading) {
      let audio: null | HTMLAudioElement = audioRef.current;
      if (!audio) return;
      else audio = audioRef.current as unknown as HTMLAudioElement;
      if (status === "PLAYING") {
        audio.play();
      } else {
        audio.pause();
      }
    }
  }, [status, currentSongLoading, startingTime]);

  function handleSeek(_: any) {
    fetch(URL + "/api/time" + "?newTime=" + currentT * Math.pow(10, 9), {
      method: "PUT",
    });
    setMovingTime(false);
  }

  function handleTimeUpdate(ev: React.SyntheticEvent<HTMLAudioElement, Event>) {
    if (ev.currentTarget && !movingTime) {
      setCurrentT((ev.currentTarget as HTMLAudioElement).currentTime);
    }
  }

  function handleTimeChange(ev: Event, value: number | number[]) {
    setMovingTime(true);
    typeof value === "number" ? setCurrentT(value) : setCurrentT(value[0]);
  }

  function formatTimeseekSlider(value: number) {
    const hours = Math.floor(value / 60 / 60);
    const minutes = Math.floor(value / 60);
    const remainingSeconds = Math.floor(value % 60);
    const minutesText = minutes < 10 ? "0" + minutes : minutes;
    const secondsText = remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;
    const hoursText = hours > 0 ? (hours < 10 ? "0" + hours : hours) + ":" : "";
    const formattedString = hoursText + minutesText + ":" + secondsText;
    return formattedString;
  }

  return (
    <Box sx={{ display: "flex", flexGrow: 1 }}>
      <StyledSlider
        min={0}
        max={(song && song.duration / 1000) || 100}
        value={currentT}
        onChange={handleTimeChange}
        onMouseUp={handleSeek}
        onKeyUp={(ev: React.KeyboardEvent) => {
          if (ev.key === " " || ev.key === "Enter") {
            handleSeek(ev);
          } else if (ev.key === "Escape") {
            setMovingTime(false);
          }
          ev.currentTarget.dispatchEvent(new Event("focusout"));
        }}
        className={sharedSliderClass}
        valueLabelDisplay="auto"
        valueLabelFormat={formatTimeseekSlider}
        size="small"
        sx={{ width: "100%", margin: "0 10px" }}
      />
      {currentSong && (
        <audio
          onTimeUpdate={(ev) => {
            handleTimeUpdate(ev);
          }}
          controls={false}
          ref={audioRef}
        />
      )}
    </Box>
  );
}
TimeseekSlider.whyDidYouRender = true;
export default TimeseekSlider;
