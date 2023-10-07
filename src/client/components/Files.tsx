import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import DesktopWindow from "./DesktopWindow";
import FilesTreeView from "./FilesTreeView";

const Files = () => {
  const { hidden } = useSelector((s: RootState) => s.windows.windows.files);
  return (
    <DesktopWindow
      gridTemplate="10% 90%/1fr 2fr"
      storeName="files"
      title="Files"
      id="files-player"
    >
      {(hidden && <div>Expand window with the + button to view files</div>) || (
        <>
          <div>
            <FilesTreeView></FilesTreeView>
          </div>
          <div></div>
        </>
      )}
    </DesktopWindow>
  );
};

export default Files;
