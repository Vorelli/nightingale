import React, { createContext, useContext, useEffect, useState } from "react";

export type NodeContextState = {
  nodes: Array<String>;
  setNodes: React.Dispatch<React.SetStateAction<Array<string>>>;
};

const NodeStateContext = createContext<null | NodeContextState>(null);

interface Props {
  children: React.ReactNode;
}

export function useNodeContext() {
  return useContext(NodeStateContext);
}

export function NodeContextProvider({ children }: Props) {
  const [nodes, setNodes] = useState<Array<string>>(new Array<string>());

  useEffect(() => {}, []);

  return (
    <NodeStateContext.Provider value={{ nodes, setNodes }}>{children}</NodeStateContext.Provider>
  );
}
