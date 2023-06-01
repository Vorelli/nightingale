import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ProjectData } from "./Project";

export type ProjectsContextState = {
  project: ProjectData[] | null;
};

const ProjectsContextStateContext = createContext<null | ProjectsContextState>(
  null
);

interface Props {
  children: React.ReactNode;
}

export function useProjectsContext() {
  return useContext(ProjectsContextStateContext);
}

export function ProjectsContextProvider({ children }: Props) {
  const { URL } = useSelector((s: RootState) => s.global);
  const [projects, setProjects] = useState<null | ProjectData[]>(null);

  useEffect(() => {
    fetch(URL + "/api/projects")
      .then((res) => res.json())
      .then((res) => {
        setProjects(res as ProjectData[]);
      })
      .catch((err) => console.error("Failed to fetch info.", err));
  }, []);

  return (
    <ProjectsContextStateContext.Provider
      value={{
        project: projects,
      }}
    >
      {children}
    </ProjectsContextStateContext.Provider>
  );
}
