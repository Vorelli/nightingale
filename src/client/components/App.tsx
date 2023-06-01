import React from "react";
import Desktop from "./Desktop";
import { AudioContextProvider } from "./AudioContextProvider";
import { NodeContextProvider } from "./NodeContextProvider";
import { TimeseekContextProvider } from "./TimeseekContextProvider";
import { InfoContextProvider } from "./InfoContextProvider";
import { ResumeContextProvider } from "./ResumeContextProvider";
import { ProjectsContextProvider } from "./ProjectsContextProvider";
import { ProjectImageContextProvider } from "./ProjectImageContextProvider";

const App = () => {
  return (
    <NodeContextProvider>
      <TimeseekContextProvider>
        <AudioContextProvider>
          <InfoContextProvider>
            <ResumeContextProvider>
              <ProjectsContextProvider>
                <ProjectImageContextProvider>
                  <Desktop />
                </ProjectImageContextProvider>
              </ProjectsContextProvider>
            </ResumeContextProvider>
          </InfoContextProvider>
        </AudioContextProvider>
      </TimeseekContextProvider>
    </NodeContextProvider>
  );
};
App.whyDidYouRender = true;
export default App;
