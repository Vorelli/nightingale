import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ClientSong } from "../redux/reducers/songsReducer";

type Props = {};

function AlbumArt({}: Props) {
  const song = useSelector((s: RootState) => {
    const songKeys = Array.from(Object.keys(s.songs.songs));
    return songKeys.length > 0 && s.songs.songs[songKeys[0]];
  });
  function isClientSong(object: any): object is ClientSong {
    if (typeof object === "boolean") return false;
    return "md5" in object && "albumArtist" in object;
  }

  if (isClientSong(song)) {
    return (
      <img
        className="albumArt w-full h-full row-start-3 row-span-2 col-start-1 object-contain bg-base-200 shadow-md shadow-base-300 drop-shadow-md"
        src={`/streaming/${song.md5}.jpg`}
        alt={"album art for " + song.albumArtist + " - " + song.albumName}
      />
    );
  } else {
    return <div>AlbumArt</div>;
  }
}

export default AlbumArt;
