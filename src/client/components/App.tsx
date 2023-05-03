import React from "react";
import Desktop from "./Desktop";
import { AudioContextProvider, useAudioContext } from "./AudioContextProvider";
import { NodeContextProvider } from "./NodeContextProvider";

const App = () => {
  return (
    <NodeContextProvider>
      <AudioContextProvider>
        <Desktop />
      </AudioContextProvider>
    </NodeContextProvider>
  );
};
App.whyDidYouRender = true;
export default App;
