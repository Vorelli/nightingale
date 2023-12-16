import React from "react";
import Desktop from "./Desktop";
import { AudioContextProvider } from "./Providers/AudioContextProvider";
import { InfoContextProvider } from "./Providers/InfoContextProvider";
import { NodeContextProvider } from "./Providers/NodeContextProvider";
import { ProjectImageContextProvider } from "./Providers/ProjectImageContextProvider";
import { ProjectsContextProvider } from "./Providers/ProjectsContextProvider";
import { ResumeContextProvider } from "./Providers/ResumeContextProvider";
import { TimeseekContextProvider } from "./Providers/TimeseekContextProvider";

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
