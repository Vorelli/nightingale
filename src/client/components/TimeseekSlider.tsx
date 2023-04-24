import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import StyledSlider from "./StyledSlider";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { AudioContextState, useAudioContext } from "./AudioContextProvider";
import { setAudioPlayable, setReloadSong } from "../redux/reducers/globalReducer";
import { secondsToTime } from "../helpers/time";

type Props = { localVolume: number; handlePlay: Function; handlePause: Function };

function TimeseekSlider({ localVolume, handlePlay, handlePause }: Props) {
  const state = useSelector((s: RootState) => s.songs);
  const { status } = useSelector((s: RootState) => s.settings);
  const { currentSong, startingTime, songs, currentSongLoading } = state;
  const song = songs[currentSong || 0];
  const [currentT, setCurrentT] = useState(0);
  const { URL, audioPlayable } = useSelector((s: RootState) => s.global);
  const [sharedSliderClass, _setSharedSliderClass] = useState(
    "bg-gradient-to-r from-secondary via-accent to-secondary"
  );
  const [movingTime, setMovingTime] = useState(false);
  const context = useAudioContext();
  const audioRef = context?.audioRef;
  const dispatch = useDispatch();
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (context !== null && !!audioRef && audioRef.current) {
      const c = context as AudioContextState;
      if (!audioSource && c.audioContext !== null && c.analyzerNode !== null) {
        const audioSource = c.audioContext.createMediaElementSource(audioRef.current);
        audioSource.connect(c.analyzerNode);
        c.analyzerNode.connect(c.audioContext.destination);
        setAudioSource(audioSource);
      }
    }
  }, [audioRef, context]);

  useEffect(() => {
    if (!!audioRef && audioRef.current && !movingTime) {
      (audioRef.current as HTMLAudioElement).volume = localVolume / 100;
    }
  }, [localVolume, audioRef]);

  useEffect(() => {
    console.log(context, currentSong, audioRef);
    if (context && !context.firstTime && currentSong && !!audioRef && audioRef.current) {
      const audio = audioRef.current as HTMLAudioElement;
      audio.src = "/streaming/" + currentSong + ".mp4";
      audio.load();
      audio.currentTime = startingTime / 1000;
      audio.volume = localVolume / 100;
    }
  }, [context?.firstTime, startingTime, currentSong]);

  useEffect(() => {
    if (!currentSongLoading && !context?.firstTime) {
      if (!audioRef) return;
      let audio: null | undefined | HTMLAudioElement = audioRef?.current;
      if (!audio) return;
      else audio = audioRef.current as unknown as HTMLAudioElement;
      audio.muted = true;
      audio
        .play()
        .then(() => !audioPlayable && dispatch(setReloadSong(true)))
        .then(() => dispatch(setAudioPlayable(true)))
        .catch(() => dispatch(setAudioPlayable(false)))
        .finally(() => {
          if (!!audio) {
            audio.muted = false;
            tryToPlay(audio);
          }
        });
    }
  }, [context?.firstTime, status, currentSongLoading, startingTime, audioPlayable]);

  navigator.mediaSession.setActionHandler("play", () => handlePlay());
  navigator.mediaSession.setActionHandler("pause", () => handlePause());

  function tryToPlay(audio: HTMLAudioElement) {
    if (status === "PLAYING" && audioPlayable) {
      context?.audioContext?.resume();
      console.log("audio is playable:", audioPlayable);
      audio.play();
    } else {
      audio.pause();
    }
  }

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
        valueLabelFormat={secondsToTime}
        size="small"
        sx={{ width: "100%", margin: "0 10px" }}
      />
      {currentSong && (
        <audio
          onTimeUpdate={(ev) => {
            handleTimeUpdate(ev);
          }}
          onPlay={(ev) => {
            (ev.currentTarget as HTMLAudioElement).play();
          }}
          onPause={(ev) => {
            (ev.currentTarget as HTMLAudioElement).pause();
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
