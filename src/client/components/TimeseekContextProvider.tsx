import React, { createContext, useContext, useState } from "react";

export type TimeseekContextState = {
  movingTime: boolean;
  setMovingTime: React.Dispatch<React.SetStateAction<boolean>>;
  currentT: number;
  setCurrentT: React.Dispatch<React.SetStateAction<number>>;
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

  return (
    <TimeseekContextStateContext.Provider
      value={{
        currentT,
        setCurrentT,
        movingTime,
        setMovingTime,
      }}
    >
      {children}
    </TimeseekContextStateContext.Provider>
  );
}
