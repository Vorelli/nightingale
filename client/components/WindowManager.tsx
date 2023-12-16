import React, { lazy, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Windows, toggleOnTop } from "../redux/reducers/windowReducer";
import { RootState } from "../redux/store";
import AppDock from "./AppDock";
import Info from "./Info";
import Inquiry from "./Inquiry";
import Lyrics from "./Lyrics";
import MainPlayer from "./MainPlayer";
import Projects from "./Projects";
import { useInfoContext } from "./Providers/InfoContextProvider";
import { useProjectsContext } from "./Providers/ProjectsContextProvider";
import { useResumeContext } from "./Providers/ResumeContextProvider";

const Resume = lazy(() => import('./resume/Resume'));
type Props = {};
interface WindowComponents {
	[key: string]: React.ReactElement | null;
}

function WindowManager({}: Props) {
	const [windowComponents, setWindowComponents] = useState<WindowComponents>(
		{},
	);
	const windows = useSelector((s: RootState) => s.windows.windows);
	const dispatch = useDispatch();
	const infoC = useInfoContext();
	const resumeC = useResumeContext();
	const projectC = useProjectsContext();

	useEffect(() => {
		setWindowComponents({
			main: <MainPlayer key={"main"} />,
			lyrics: <Lyrics key="lyrics" />,
			//files: <Files key="files" />,
			inquiry: <Inquiry key="inquiry" />,
			info: infoC && infoC.info ? <Info key="info" /> : null,
			projects:
				projectC && projectC.project ? <Projects key="projects" /> : null,
			resume: resumeC && resumeC.resume ? <Resume key="resume" /> : null,
		});
	}, [infoC, resumeC, projectC]);

	const hiddenWindows = new Array<string>();
	const windowKeys = Object.keys(windows).filter(
		(key) => !!windowComponents[key],
	);
	for (let i = 0; i < windowKeys.length; i++) {
		const window = windows[windowKeys[i]];
		if (windowComponents[windowKeys[i]]) {
			if (window.onTop) hiddenWindows.push(windowKeys[i]);
		}
	}

	const hidden = hiddenWindows.reduce<Windows>((acc: Windows, key: string) => {
		acc[key] = windows[key];
		return acc;
	}, {} as Windows);

	function handleIconClick(_ev: React.MouseEvent, windowName: string) {
		dispatch(toggleOnTop({ name: windowName }));
	}

	return (
		<div className="windowDockManager h-full w-full z-[-10]">
			<div className="absolute activeWindows w-0 h-0">
				{windowComponents &&
					windowKeys
						.filter((key) => windowComponents[key])
						.map((key: string) => windowComponents[key])}
			</div>
			<AppDock handleClick={handleIconClick} windows={hidden} />
		</div>
	);
}

export default WindowManager;