import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setAudioPlayable, setReloadSong } from "../redux/reducers/globalReducer";
import {
  currentSongRequest,
  currentSongRequestSuccess,
  setStartTime,
} from "../redux/reducers/songsReducer";
import { setStatus } from "../redux/reducers/settingsReducer";

export type AudioContextState = {
  audioContext: AudioContext | null;
  analyzerNode: AnalyserNode | null;
  audioRef: React.MutableRefObject<null | HTMLAudioElement>;
  runFirstTime: Function;
  audioSource: MediaElementAudioSourceNode | null;
  setAudioSource: React.Dispatch<React.SetStateAction<null | MediaElementAudioSourceNode>>;
  movingTime: boolean;
  setMovingTime: React.Dispatch<React.SetStateAction<boolean>>;
  currentT: number;
  setCurrentT: React.Dispatch<React.SetStateAction<number>>;
};

const AudioContextStateContext = createContext<null | AudioContextState>(null);

interface Props {
  children: React.ReactNode;
}

export function useAudioContext() {
  return useContext(AudioContextStateContext);
}

export function AudioContextProvider({ children }: Props) {
  const [audioContext, setAudioContext] = useState<null | AudioContext>(null);
  const [analyzerNode, setAnalyzerNode] = useState<null | AnalyserNode>(null);
  const [audioSource, setAudioSource] = useState<null | MediaElementAudioSourceNode>(null);
  const [firstTime, setFirstTime] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { numBars } = useSelector((s: RootState) => s.audio);
  const dispatch = useDispatch();
  const [movingTime, setMovingTime] = useState(false);
  const [currentT, setCurrentT] = useState(0);
  const { URL } = useSelector((s: RootState) => s.global);

  const { status } = useSelector((s: RootState) => s.settings);
  const { startingTime, currentSongLoading } = useSelector((s: RootState) => s.songs);

  navigator.mediaSession.setActionHandler("play", () => handlePlay());
  navigator.mediaSession.setActionHandler("pause", () => handlePause());

  function handlePlay() {
    fetch("/api/play", { method: "PUT" });
  }

  function handlePause() {
    fetch("/api/pause", { method: "PUT" });
  }

  function tryToPlay(audio: HTMLAudioElement) {
    if (audioContext && status === "PLAYING" && audio.paused) {
      audioContext.resume();
      audio.play();
    } else if (!audio.paused && status === "PAUSED") {
      audio.pause();
    }
  }

  useEffect(() => {
    if (!firstTime && audioRef && audioRef.current && !currentSongLoading) {
      dispatch(setReloadSong(true));
      tryToPlay(audioRef.current);
    }
  }, [firstTime, startingTime, currentSongLoading, status]);

  function handleTimeUpdate(ev: React.SyntheticEvent<HTMLAudioElement, Event>) {
    if (ev.currentTarget && !movingTime) {
      setCurrentT((ev.currentTarget as HTMLAudioElement).currentTime);
    }
  }

  useEffect(() => {
    if (!audioContext) {
      const context = new AudioContext();
      const analyzer = context.createAnalyser();
      analyzer.fftSize = numBars * 2;
      setAudioContext(context);
      setAnalyzerNode(analyzer);
    } else {
      audioContext.resume();
    }

    if (audioRef.current === null) {
      const audioElement = new Audio();
      document.body.appendChild(audioElement);
      audioRef.current = audioElement;
    }

    return () => {
      if (audioContext) audioContext.close();
    };
  }, []);

  useEffect(() => {
    if (audioContext !== null && audioRef !== undefined && audioRef.current !== null) {
      if (audioSource === null && audioContext !== null && analyzerNode !== null) {
        const audioSource = audioContext.createMediaElementSource(audioRef.current);
        audioSource.connect(analyzerNode);
        analyzerNode.connect(audioContext.destination);
        setAudioSource(audioSource);
      }
    }
  }, [audioRef, audioContext]);

  const reloadSong = () => {
    dispatch(currentSongRequest());
    const timeBefore = new Date();
    fetch(URL + "/api/sync")
      .then((data) => data.json())
      .then((syncData) => {
        if (syncData.currentSong && (syncData.currentTime === 0 || syncData.currentTime)) {
          dispatch(currentSongRequestSuccess(syncData.currentSong));
          const ping = new Date().getUTCMilliseconds() - timeBefore.getUTCMilliseconds();
          dispatch(setStartTime(parseInt(syncData.currentTime) + ping / 2));
          dispatch(setStatus(syncData.status));
        }
      })
      .catch((err) => {
        console.log("error encountered when trying to sync with the server", err);
      });
  };

  function runFirstTime(ev: React.MouseEvent | React.TouchEvent) {
    console.log(ev);
    ev.preventDefault();
    let audio2: null | HTMLAudioElement = audioRef.current;
    console.log("firstTime", firstTime, "audioRef", audioRef, "audio2", audio2);
    if (!firstTime || !audioRef || !audio2) return;
    setFirstTime(false);

    try {
      reloadSong();
      dispatch(setAudioPlayable(true));
    } catch (err) {
      dispatch(setAudioPlayable(false));
    }
  }

  return (
    <AudioContextStateContext.Provider
      value={{
        audioContext,
        analyzerNode,
        audioRef,
        runFirstTime,
        audioSource,
        setAudioSource,
        currentT,
        setCurrentT,
        movingTime,
        setMovingTime,
      }}
    >
      {children}
      {audioRef.current && (
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
    </AudioContextStateContext.Provider>
  );
}
