import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import DesktopWindow from "./DesktopWindow";
import LyricsLine from "./LyricsLine";

const Lyrics = () => {
  const { currentSong, songs } = useSelector((s: RootState) => s.songs);
  const { hidden } = useSelector((s: RootState) => s.windows.windows["info"]);
  const { audioPlayable } = useSelector((s: RootState) => s.global);

  return (
    <DesktopWindow storeName="lyrics" title="Lyrics" id="lyrics-player">
      {(!hidden && (
        <div className="overflow-y-scroll flex flex-col items-center col-span-2 m-2 mr-0">
          {(currentSong &&
            songs[currentSong].lyrics.map((line, i) => {
              line = line.trim();
              return <LyricsLine key={i} line={line === "" ? "<br>" : line} />;
            })) ||
            (!audioPlayable && (
              <div>
                Please enable audio playback in Nightingale to view Lyrics
              </div>
            )) || <div>Loading...</div>}
        </div>
      )) || <div>Expand to view Lyrics</div>}
      <div></div>
    </DesktopWindow>
  );
};

export default Lyrics;
