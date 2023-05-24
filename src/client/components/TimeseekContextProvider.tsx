import React, { createContext, useContext, useState } from "react";

export type TimeseekContextState = {
  movingTime: boolean;
  setMovingTime: React.Dispatch<React.SetStateAction<boolean>>;
  currentT: number;
  setCurrentT: Function; //React.Dispatch<React.SetStateAction<number>>;
};

const TimeseekContextStateContext = createContext<null | TimeseekContextState>(null);

interface Props {
  children: React.ReactNode;
}

export function useTimeseekContext() {
  return useContext(TimeseekContextStateContext);
}

export function TimeseekContextProvider({ children }: Props) {
  const [movingTime, setMovingTime] = useState(false);
  const [currentT, setCurrentT] = useState(0);
  function actuallySetCurrentT(val: number, ident: string) {
    console.log("identity:", ident);
    console.log("setting from", currentT, "to", val);
    setCurrentT(val);
  }

  return (
    <TimeseekContextStateContext.Provider
      value={{
        currentT,
        setCurrentT: actuallySetCurrentT,
        movingTime,
        setMovingTime,
      }}
    >
      {children}
    </TimeseekContextStateContext.Provider>
  );
}
