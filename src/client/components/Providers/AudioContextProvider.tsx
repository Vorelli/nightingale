import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  setAudioPlayable,
  setReloadSong
} from "../../redux/reducers/globalReducer";
import {
  ClientSong,
  currentSongRequest,
  currentSongRequestSuccess,
  setStartTime
} from "../../redux/reducers/songsReducer";
import { setStatus } from "../../redux/reducers/settingsReducer";
import { useTimeseekContext } from "./TimeseekContextProvider";
import { objectsDeepEqual } from "../../helpers/objectsDeepEqual";

export type AudioContextState = {
  audioContext: AudioContext | null;
  analyzerNode: AnalyserNode | null;
  audioRef: React.MutableRefObject<null | HTMLAudioElement>;
  runFirstTime: Function;
  reloadSong: Function;
  audioSource: MediaElementAudioSourceNode | null;
  setAudioSource: React.Dispatch<
    React.SetStateAction<null | MediaElementAudioSourceNode>
  >;
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
  setCurrentT
}: Props & PropsWithChildren) {
  const [audioContext, setAudioContext] = useState<null | AudioContext>(null);
  const [analyzerNode, setAnalyzerNode] = useState<null | AnalyserNode>(null);
  const [audioSource, setAudioSource] =
    useState<null | MediaElementAudioSourceNode>(null);
  const [firstTime, setFirstTime] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dispatch = useDispatch();

  const { numBars } = useSelector((s: RootState) => s.audio);
  const { currentSong, songs, startingTime, currentSongLoading } =
    useSelector((s: RootState) => s.songs);
  const { URL } = useSelector((s: RootState) => s.global);
  const { status } = useSelector((s: RootState) => s.settings);

  useEffect(() => {
    if (navigator.mediaSession) {
      navigator.mediaSession.setActionHandler("play", handlePlay);
      navigator.mediaSession.setActionHandler("pause", handlePause);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);
      navigator.mediaSession.setActionHandler(
        "previoustrack",
        handlePrev
      );
    }
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [navigator.mediaSession]);

  useEffect(() => {
    const song = songs[currentSong || ""];
    const meta = JSON.stringify(navigator.mediaSession.metadata);
    const newMeta = song && metadataFromSong(song);
    if (
      typeof currentSong === "string" &&
      song &&
      navigator.mediaSession &&
      !objectsDeepEqual(meta, newMeta)
    ) {
      navigator.mediaSession.metadata = newMeta;
    }
  }, [songs, currentSong]);

  function metadataFromSong(song: ClientSong): MediaMetadata {
    return new MediaMetadata({
      title: song.name,
      artist: song.albumArtist,
      album: song.albumName,
      artwork: [
        {
          sizes: "256x256",
          type: "image/jpg",
          src: `/streaming/${song.md5}.jpg`
        }
      ]
    });
  }

  function handlePrev() {
    fetch(URL + "/api/prev", { method: "PUT" });
  }

  function handleNext() {
    fetch(URL + "/api/next", { method: "PUT" });
  }

  function handlePlay(deets: MediaSessionActionDetails) {
    console.log(deets);
    fetch(URL + "/api/play", { method: "PUT" });
  }

  function handlePause() {
    fetch(URL + "/api/pause", { method: "PUT" });
  }

  function handleTimeUpdate(
    _ev: React.SyntheticEvent<HTMLAudioElement, Event>
  ) {
    if (audioSource && !movingTime) {
      setCurrentT &&
        setCurrentT(
          audioSource.mediaElement.currentTime,
          "handleTimeUpdate in audioContextProvider"
        );
    }
    const song = currentSong && songs[currentSong];
    if (song && audioSource)
      navigator.mediaSession.setPositionState({
        duration: song.duration,
        playbackRate: 1,
        position: Math.max(0, audioSource.mediaElement.currentTime ?? 0)
      });
  }

  /**
   * This useEffect's main purpose is to check for audio permissions. If we have them,
   * we can auto play audio and don't need to wait for user input.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!!audio) {
      audio.muted = true;
      try {
        const tryingToPlay = audio.play();
        tryingToPlay
          .then(() => {
            audio.muted = false;
            if (
              audio.src.indexOf("streaming") === -1 &&
              currentSong
            ) {
              audio.src = "/streaming/" + currentSong + ".mp4";
            }
            audio.pause();
            runFirstTime();
            // if the error is caught, we'll have to wait for user interaction to begin playing
          })
          .catch((err) =>
            console.log(
              "error when trying to check for permissions",
              err
            )
          );
      } catch (err) {
        console.log("error encountered when trying to play audio");
      }
    }
  }, []);

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

  /*
   * This useEffect's purpose is to change the audio's src when the
   * currentSong changes in the redux state. This can happen for various
   * reasons but it all comes back to the server or the client requesting
   * the client to sync up.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!!audio && currentSong && !currentSongLoading) {
      const currentSrc = audio.src;
      const indexOfStreaming = currentSrc.indexOf("/streaming/");
      if (
        indexOfStreaming === -1 ||
        currentSong !== currentSrc.slice(indexOfStreaming + 11, -4)
      ) {
        const newSrc = "/streaming/" + currentSong + ".mp4";
        audio.crossOrigin = "anonymous";
        audio.src = newSrc;
        audio.load();
      }
    }
  }, [currentSong, currentSongLoading, songs]);

  /**
   * This useEffect's purpose is to start playing after the src has changed.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (currentSong && !!audio && !firstTime && !currentSongLoading) {
      dispatch(setReloadSong(true));
      if (audioContext && status === "PLAYING" && audio.paused) {
        audioContext.resume();
        audio.play().catch((_err) => {
          //need to wait for permissions
          dispatch(setAudioPlayable(false));
          setFirstTime(true);
        });
      } else if (!audio.paused && status === "PAUSED") {
        audio.pause();
      }
    }
  }, [startingTime, currentSong, firstTime, currentSongLoading, status]);

  /**
   * This useEffect sets the syncs up the audio's current time when the startingTime changes.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!!audio) audio.currentTime = startingTime;
  }, [startingTime]);

  /**
   * This useEffect sets up the chain for the visualizer.
   */
  useEffect(() => {
    if (
      audioContext !== null &&
      audioRef !== undefined &&
      audioRef.current !== null &&
      analyzerNode !== null &&
      audioSource === null
    ) {
      const audioSource = audioContext.createMediaElementSource(
        audioRef.current
      );
      audioSource.connect(analyzerNode);
      analyzerNode.connect(audioContext.destination);
      setAudioSource(audioSource);
    }
  }, [audioRef, audioContext]);

  /**
   * This function does all the various dispatchs required to get the client's
   * state synced up with the server's.
   */
  function reloadSong() {
    dispatch(currentSongRequest());
    const timeBefore = new Date();
    fetch(URL + "/api/sync")
      .then((data) => data.json())
      .then((syncData) => {
        if (syncData.currentSong && syncData.currentTime >= 0) {
          const nowInMilli = new Date().getMilliseconds();
          const ping = nowInMilli - timeBefore.getMilliseconds();
          const currentTime = parseInt(syncData.currentTime);
          const t = currentTime / 1000 - ping / 2000;

          const song = songs[syncData.currentSong];
          if (song) {
          }
          dispatch(currentSongRequestSuccess(syncData.currentSong));
          dispatch(setStartTime(Math.floor(t)));
          dispatch(setStatus(syncData.status));
        }
      })
      .catch((err) => console.log("error when trying to sync", err));
  }

  /**
   * This function syncs playback with the server and sets audio to playable.
   * This should only be called with the intention to play audio after.
   * @param ev Possible event from an event listener. Not necessary.
   * @returns
   */
  function runFirstTime(ev?: React.MouseEvent | React.TouchEvent) {
    if (ev) ev.preventDefault();
    const audio = audioRef.current;
    if (!audioRef || !audio) return;

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
        setAudioSource
      }}
    >
      {children}
      {
        <audio
          src="test.mp3"
          onTimeUpdate={(ev) => handleTimeUpdate(ev)}
          onPlay={() => {
            navigator.mediaSession.playbackState = "playing";
          }}
          onPause={() => {
            navigator.mediaSession.playbackState = "paused";
          }}
          controls={false}
          ref={audioRef}
        />
      }
    </AudioContextStateContext.Provider>
  );
});

// Needed to make the function pure as to avoid unnecessary renders.
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
