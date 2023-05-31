import React from "react";
import Desktop from "./Desktop";
import { AudioContextProvider } from "./AudioContextProvider";
import { NodeContextProvider } from "./NodeContextProvider";
import { TimeseekContextProvider } from "./TimeseekContextProvider";
import { InfoContextProvider } from "./InfoContextProvider";

const App = () => {
  return (
    <NodeContextProvider>
      <TimeseekContextProvider>
        <AudioContextProvider>
          <InfoContextProvider>
            <Desktop />
          </InfoContextProvider>
        </AudioContextProvider>
      </TimeseekContextProvider>
    </NodeContextProvider>
  );
};
App.whyDidYouRender = true;
export default App;
