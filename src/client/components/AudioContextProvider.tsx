import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

export type AudioContextState = {
  audioContext: AudioContext | null;
  analyzerNode: AnalyserNode | null;
  audioRef: React.MutableRefObject<null>;
  firstTime: boolean;
  setFirstTime: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [firstTime, setFirstTime] = useState(true);
  const audioRef = useRef(null);
  const { numBars } = useSelector((s: RootState) => s.audio);

  useEffect(() => {
    const context = new AudioContext();
    const analyzer = context.createAnalyser();
    analyzer.fftSize = numBars * 2;
    setAudioContext(context);
    setAnalyzerNode(analyzer);

    return () => {
      context.close();
    };
  }, []);

  return (
    <AudioContextStateContext.Provider
      value={{ audioContext, analyzerNode, audioRef, firstTime, setFirstTime }}
    >
      {children}
    </AudioContextStateContext.Provider>
  );
}
