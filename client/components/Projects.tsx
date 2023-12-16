import React from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import DesktopWindow from "./DesktopWindow";
import Project from "./Project";
import { useProjectsContext } from "./Providers/ProjectsContextProvider";

const Projects = () => {
	const projectC = useProjectsContext();
	const [index, setIndex] = useState(0);
	const { hidden } = useSelector((s: RootState) => s.windows.windows.projects);
	const length = projectC && projectC.project ? projectC.project.length : 0;
	const handleRight = () => setIndex((i) => (i + 1) % length);
	const handleLeft = () => setIndex((i) => (length + (i - 1)) % length);

	const project = projectC && projectC.project && projectC.project[index];
	const header = (
		<>
			<div className="text-center pt-2">
				<p>Project Name: {(project && project.name) || "Loading..."}</p>
				<p>Role: {(project && project.role) || "Loading..."}</p>
			</div>
			<div className="flex pt-2 flex-col text-center [&>*]:pointer-events-auto">
				{project &&
					project.links.map((link) => (
						<a
							key={link.name}
							draggable={false}
							className=""
							target="_blank"
							href={link.url}
							rel="noreferrer"
						>
							{link.name}
						</a>
					))}
			</div>
		</>
	);
	return (
		<DesktopWindow
			gridTemplate={hidden ? "50% 50%/1fr" : "10% 85% 5%/1fr 1fr"}
			storeName="projects"
			title="Projects"
			id="projects-player"
			headerElements={header}
		>
			{projectC && projectC.project ? (
				<Project
					project={projectC.project[index]}
					handleLeft={handleLeft}
					handleRight={handleRight}
				/>
			) : (
				<div>Loading...</div>
			)}
		</DesktopWindow>
	);
};

export default Projects;
