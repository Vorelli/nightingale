import React, { createContext, useContext, useState } from "react";

interface Image {
  src: string;
  alt: string;
}

export type ProjectImageContextState = {
  image: Image | null;
  setImage: Function;
  zoom: boolean;
  toggleZoom: Function;
  lastI: number;
  lastFirst: Image | null;
  setLastFirst: Function;
};

const ProjectImageContextStateContext =
  createContext<null | ProjectImageContextState>(null);

interface Props {
  children: React.ReactNode;
}

export function useProjectImageContext() {
  return useContext(ProjectImageContextStateContext);
}

export function ProjectImageContextProvider({ children }: Props) {
  const [projectImage, setProjectImage] = useState<null | Image>(null);
  const [zoom, setZoom] = useState<boolean>(false);
  const [lastI, setLastI] = useState(0);
  const [lastFirst, setLastFirst] = useState<null | Image>(null);
  return (
    <ProjectImageContextStateContext.Provider
      value={{
        image: projectImage,
        setImage: (image: Image) => setProjectImage(image),
        zoom,
        toggleZoom: (i: number) => {
          setZoom((z) => !z);
          i !== undefined && setLastI(i);
        },
        lastI,
        lastFirst,
        setLastFirst: (image: Image) => setLastFirst(image),
      }}
    >
      {children}
    </ProjectImageContextStateContext.Provider>
  );
}
