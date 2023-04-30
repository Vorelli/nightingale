import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setAudioPlayable, setReloadSong } from "../redux/reducers/globalReducer";

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

  async function tryToPlay(audio: HTMLAudioElement) {
    if (status === "PLAYING") {
      await audioContext?.resume();
      await audio.play();
    } else {
      await audio.pause();
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

  function runFirstTime() {
    if (!firstTime) return;
    setFirstTime(false);
    if (!audioRef) return;
    let audio2: null | undefined | HTMLAudioElement = audioRef?.current;
    if (!audio2) return;

    let audio = audioRef.current as unknown as HTMLAudioElement;

    const playAudio = async () => {
      try {
        dispatch(setReloadSong(true));
        dispatch(setAudioPlayable(true));
      } catch (err) {
        dispatch(setAudioPlayable(false));
      }
    };
    playAudio();
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
