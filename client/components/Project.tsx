import East from "@mui/icons-material/East";
//import TechnologyBullets from "./TechnologyBullets";
import West from "@mui/icons-material/West";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import Images from "./Images";
import { useProjectImageContext } from "./Providers/ProjectImageContextProvider";
import TechnologyBadges from "./TechnologyBadges";

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
	const { hidden } = useSelector(
		(s: RootState) => s.windows.windows["projects"],
	);
	return (
		(hidden && (
			<div className="row-start-2">
				Expand the window with the + button in the top right to view projects
			</div>
		)) ||
		(imageC && imageC.zoom && imageC.image ? (
			<div className="col-span-2 row-span-2 w-full h-full">
				<img
					className="w-full h-full object-contain"
					onClick={() => imageC.toggleZoom()}
					src={imageC.image.src}
					alt={imageC.image.alt}
				/>
			</div>
		) : (
			<>
				<div className="left grid p-2" style={{ gridTemplate: "50% 50%/1fr" }}>
					<Images images={project.images} />
					<TechnologyBadges technology={project.technology} />
				</div>
				<div className="right flex p-2 flex-col justify-around items-center space-y-4">
					<h4 className="text-lg font-bold">Description:</h4>
					<div className="overflow-y-auto w-[90%] space-y-2 flex flex-col items-center">
						{project.description.map((p) => (
							<p className="indent-4" key={p}>
								{p}
							</p>
						))}
					</div>
					<h4 className="text-lg font-bold">Technical Challenges</h4>
					<div className="overflow-y-auto w-[90%] space-y-2 flex flex-col items-center">
						{project.challenges.reduce((acc, challenge) => {
							return acc.concat(
								challenge.split("\n").map((challenge) => (
									<p className="indent-4" key={challenge}>
										{challenge}
									</p>
								)),
							);
						}, new Array<React.ReactElement>())}
					</div>
				</div>
				<div className="col-span-2 flex justify-between">
					<IconButton onClick={(ev) => handleLeft(ev)}>
						<West className="text-primary" />
					</IconButton>
					<IconButton onClick={(ev) => handleRight(ev)}>
						<East className="text-primary" />
					</IconButton>
				</div>
			</>
		))
	);
};

export default Project;
