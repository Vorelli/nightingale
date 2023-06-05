import React, { lazy, useEffect, useState } from "react";
import DesktopWindow from "./DesktopWindow";
import { useResumeContext } from "./Providers/ResumeContextProvider";
import PersonalInfo from "./PersonalInfo";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";

const Document = lazy(() => import("react-pdf/dist/esm/Document"));
const Page = lazy(() => import("react-pdf/dist/esm/Page"));
import("./ResumeStyle");
import("react-pdf").then((pdf) => {
    pdf.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "../../../node_modules/.pnpm/pdfjs-dist@3.6.172/node_modules/pdfjs-dist/build/pdf.worker.min.js",
        import.meta.url
    ).toString();
});

const Resume = () => {
    const { hidden } = useSelector(
        (s: RootState) => s.windows.windows["resume"]
    );
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
        scrollbarGutter: "stable"
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
