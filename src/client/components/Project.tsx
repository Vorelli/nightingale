import { Icon, IconButton } from "@mui/material";
import React from "react";
import Images from "./Images";
import TechnologyBadges from "./TechnologyBadges";
//import TechnologyBullets from "./TechnologyBullets";
import West from "@mui/icons-material/West";
import East from "@mui/icons-material/East";
import { useProjectImageContext } from "./ProjectImageContextProvider";

export interface Image {
  src: string;
  alt: string;
}

interface Link {
  url: string;
  name: string;
}

export interface ProjectData {
  name: string;
  role: string;
  technology: string[];
  images: Image[];
  description: string[];
  challenges: string[];
  links: Link[];
}

interface Props {
  project: ProjectData;
  handleLeft: React.MouseEventHandler;
  handleRight: React.MouseEventHandler;
}

const Project = ({ project, handleLeft, handleRight }: Props) => {
  const imageC = useProjectImageContext();

  return imageC && imageC.zoom && imageC.image ? (
    <div className="w-full h-full">
      <img
        className="w-full h-full object-contain"
        onClick={() => imageC.toggleZoom()}
        src={imageC.image.src}
        alt={imageC.image.alt}
      />
    </div>
  ) : (
    <div
      style={{ gridTemplate: "10% 85% 5%/1fr 1fr" }}
      className="h-full w-full grid"
      id="projects-inner"
    >
      <header className="col-span-2 relative flex flex-col items-center">
        <p>Name: {project.name}</p>
        <p>Role: {project.role}</p>
        <div className="absolute right-0 top-0 flex flex-col">
          {project.links.map((link) => (
            <a key={link.name} className="text-lg" href={link.url}>
              {link.name}
            </a>
          ))}
        </div>
      </header>
      <div className="left grid p-2" style={{ gridTemplate: "50% 50%/1fr" }}>
        <Images images={project.images} />
        <TechnologyBadges technology={project.technology} />
      </div>
      <div className="right flex p-2 flex-col justify-around items-center space-y-2">
        <h4>Description:</h4>
        <div className="overflow-y-auto">
          {project.description.map((p) => (
            <p className="indent-4" key={p}>
              {p}
            </p>
          ))}
        </div>
        <h4>Technical Challenges</h4>
        <div className="overflow-y-auto">
          {project.challenges.reduce((acc, challenge) => {
            return acc.concat(
              challenge.split("\n").map((challenge) => (
                <p className="indent-4" key={challenge}>
                  {challenge}
                </p>
              ))
            );
          }, new Array<React.ReactElement>())}
        </div>
      </div>
      <div className="col-span-2 flex justify-between">
        <IconButton onClick={handleLeft}>
          <West />
        </IconButton>
        <IconButton onClick={handleRight}>
          <East />
        </IconButton>
      </div>
    </div>
  );
};

export default Project;
