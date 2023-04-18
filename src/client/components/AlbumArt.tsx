import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ClientSong } from "../redux/reducers/songsReducer";

type Props = {};

function AlbumArt({}: Props) {
  const { currentSong, songs } = useSelector((s: RootState) => s.songs);
  const { hidden } = useSelector((s: RootState) => s.windows["main"]);

  const song = songs[currentSong || ""];
  function isClientSong(object: any): object is ClientSong {
    if (typeof object === "boolean") return false;
    return "md5" in object && "albumArtist" in object;
  }

  return (
    song && (
      <img
        key={7}
        className={
          "albumArt box-border border-solid border-primary border-[1px] w-full h-full row-start-3 row-span-2 col-start-1 object-contain bg-neutral shadow-md shadow-base-300 " +
          (hidden ? "p-[1px]" : "p-[3px]")
        }
        src={`/streaming/${song.md5}.jpg`}
        alt={"album art for " + song.albumArtist + " - " + song.albumName}
      />
    )
  );
}

export default AlbumArt;
