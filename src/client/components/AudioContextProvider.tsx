import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setAudioPlayable, setReloadSong } from "../redux/reducers/globalReducer";
import {
  currentSongRequest,
  currentSongRequestSuccess,
  setStartTime,
} from "../redux/reducers/songsReducer";
import { setStatus } from "../redux/reducers/settingsReducer";
import { useTimeseekContext } from "./TimeseekContextProvider";

export type AudioContextState = {
  audioContext: AudioContext | null;
  analyzerNode: AnalyserNode | null;
  audioRef: React.MutableRefObject<null | HTMLAudioElement>;
  runFirstTime: Function;
  reloadSong: Function;
  audioSource: MediaElementAudioSourceNode | null;
  setAudioSource: React.Dispatch<React.SetStateAction<null | MediaElementAudioSourceNode>>;
};

const AudioContextStateContext = createContext<null | AudioContextState>(null);

export function useAudioContext() {
  return useContext(AudioContextStateContext);
}

interface Props {
  movingTime: boolean | undefined;
  setCurrentT: Function | undefined;
}

const InnerAudioContextProvider = React.memo(function AudioContextProvider({
  children,
  movingTime,
  setCurrentT,
}: Props & PropsWithChildren) {
  const [audioContext, setAudioContext] = useState<null | AudioContext>(null);
  const [analyzerNode, setAnalyzerNode] = useState<null | AnalyserNode>(null);
  const [audioSource, setAudioSource] = useState<null | MediaElementAudioSourceNode>(null);
  const [firstTime, setFirstTime] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { numBars } = useSelector((s: RootState) => s.audio);
  const { currentSong } = useSelector((s: RootState) => s.songs);
  const dispatch = useDispatch();
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

  function handleTimeUpdate(_ev: React.SyntheticEvent<HTMLAudioElement, Event>) {
    if (audioSource && !movingTime) {
      setCurrentT &&
        setCurrentT(
          audioSource.mediaElement.currentTime,
          "handleTimeUpdate in audioContextProvider"
        );
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
    if (currentSong && !!audioRef && audioRef.current) {
      const audio = audioRef.current as HTMLAudioElement;
      const currentSrc = audio.src;
      const indexOfStreaming = currentSrc.indexOf("/streaming/");
      if (indexOfStreaming === -1 || currentSong !== currentSrc.slice(indexOfStreaming + 11, -4)) {
        const newSrc = URL + "/streaming/" + currentSong + ".mp4";
        audio.crossOrigin = "anonymous";
        audio.src = newSrc;
        audio.load();
      }
      if (!firstTime && audioRef && audioRef.current && !currentSongLoading) {
        dispatch(setReloadSong(true));
        tryToPlay(audioRef.current);
      }
    }
  }, [startingTime, currentSong, firstTime, currentSongLoading, status]);

  useEffect(() => {
    if (!audioRef || !audioRef.current) {
      return;
    }
    audioRef.current.currentTime = startingTime;
  }, [startingTime, audioRef]);

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
        if (syncData.currentSong && syncData.currentTime >= 0) {
          dispatch(currentSongRequestSuccess(syncData.currentSong));
          const ping = new Date().getUTCMilliseconds() - timeBefore.getUTCMilliseconds();
          dispatch(setStartTime(Math.floor(parseInt(syncData.currentTime) / 1000 - ping / 2000)));
          dispatch(setStatus(syncData.status));
        }
      })
      .catch((err) => {
        console.log("error encountered when trying to sync with the server", err);
      });
  };

  function runFirstTime(ev: React.MouseEvent | React.TouchEvent) {
    ev.preventDefault();
    let audio2: null | HTMLAudioElement = audioRef.current;
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
        reloadSong,
        audioSource,
        setAudioSource,
      }}
    >
      {children}
      {audioRef.current && (
        <audio
          onTimeUpdate={(ev) => handleTimeUpdate(ev)}
          onPlay={(ev) => (ev.currentTarget as HTMLAudioElement).play()}
          onPause={(ev) => (ev.currentTarget as HTMLAudioElement).pause()}
          controls={false}
          ref={audioRef}
        />
      )}
    </AudioContextStateContext.Provider>
  );
});

export function AudioContextProvider({ children }: PropsWithChildren) {
  const timeseekContext = useTimeseekContext();

  return (
    <InnerAudioContextProvider
      setCurrentT={timeseekContext?.setCurrentT}
      movingTime={timeseekContext?.movingTime}
    >
      {children}
    </InnerAudioContextProvider>
  );
}

AudioContextProvider.whyDidYouRender = true;
