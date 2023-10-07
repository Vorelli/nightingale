import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import DesktopWindow from "./DesktopWindow";
import { useInfoContext } from "./Providers/InfoContextProvider";
import InfoLine from "./InfoLine";

const Info = () => {
    const c = useInfoContext();
    const { hidden } = useSelector((s: RootState) => s.windows.windows["info"]);

    return (
        <DesktopWindow storeName="info" title="Info" id="info-player">
            {(!hidden && (
                <div className="overflow-y-auto col-span-2 m-2 mr-0">
                    {(c &&
                        c.info &&
                        c.info.split("\n").map((line, i) => {
                            line = line.trim();
                            return (
                                <InfoLine
                                    key={i}
                                    line={line === "" ? "<br>" : line}
                                />
                            );
                        })) || <div>Loading...</div>}
                </div>
            )) || <div>Expand to view Info</div>}
            <div></div>
        </DesktopWindow>
    );
};

export default Info;
