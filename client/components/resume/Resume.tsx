import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import DesktopWindow from "../DesktopWindow";
import PersonalInfo from "../PersonalInfo";
import { useResumeContext } from "../Providers/ResumeContextProvider";
import { Page, Document } from "react-pdf"
import { pdfjs } from 'react-pdf';

//import("./ResumeStyle.ts");
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
const Resume = () => {
	const { hidden } = useSelector((s: RootState) => s.windows.windows["resume"]);
	const resumeC = useResumeContext();

	useEffect(() => {}, []);

	const resume =
		resumeC && resumeC.resume ? (
			Document && (
				<Document
					file={resumeC.resume}
					className="w-full flex flex-col items-center col-span-2 m-auto"
				>
					{Page && <Page pageNumber={1} />}
				</Document>
			)
		) : (
			<div>Loading...</div>
		);
	const style: React.CSSProperties = {
		scrollbarGutter: "stable",
	};

	return (
		<DesktopWindow
			storeName="resume"
			title="Personal"
			id="resume-player"
			cutoutIcon={true}
		>
			{resumeC && resumeC.resume && resumeC.personal ? (
				<div
					style={style}
					className="h-full w-full flex flex-col items-center col-span-2 overflow-y-auto m-auto"
				>
					{!hidden ? (
						<>
							<PersonalInfo info={resumeC.personal} />
							{resume}
						</>
					) : (
						<div>Please expand to view the personal app</div>
					)}
				</div>
			) : (
				<div>Loading...</div>
			)}
		</DesktopWindow>
	);
};

export default Resume;
