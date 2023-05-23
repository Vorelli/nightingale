import React from "react";
import Desktop from "./Desktop";
import { AudioContextProvider } from "./AudioContextProvider";
import { NodeContextProvider } from "./NodeContextProvider";
import { TimeseekContextProvider } from "./TimeseekContextProvider";

const App = () => {
  return (
    <NodeContextProvider>
      <TimeseekContextProvider>
        <AudioContextProvider>
          <Desktop />
        </AudioContextProvider>
      </TimeseekContextProvider>
    </NodeContextProvider>
  );
};
App.whyDidYouRender = true;
export default App;
