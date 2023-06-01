import React from "react";
import { useState } from "react";
import DesktopWindow from "./DesktopWindow";
import Project from "./Project";
import { useProjectsContext } from "./ProjectsContextProvider";

const Projects = () => {
  const projectC = useProjectsContext();
  const [index, setIndex] = useState(0);
  const length = projectC && projectC.project ? projectC.project.length : 0;
  const handleRight = () => setIndex((i) => (i + 1) % length);
  const handleLeft = () => setIndex((i) => (i - 1) % length);

  console.log("project:", projectC?.project);
  return (
    <DesktopWindow storeName="projects" title="Projects" id="projects-player">
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
