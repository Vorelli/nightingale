import React from "react";
import { useSelector, useDispatch } from "react-redux";
import PlaylistLabel from "./PlaylistLabel";
import { RootState } from "../redux/store";

type Props = {};

function PlaylistContainer({}: Props) {
  const dispatch = useDispatch();
  const { playlists, loading, playlistIndex } = useSelector((state: RootState) => state.playlists);
  const { songs } = useSelector((state: RootState) => state.songs);

  const rows = playlists[playlistIndex]?.songs.map((song: string) => songs[song]);
  const columns = [
    { field: "track", headerName: "Track", width: 50 },
    { field: "name", headerName: "Title", width: 200 },
    { field: "albumArtist", headerName: "Artist", width: 150 },
    { field: "albumName", headerName: "Album", width: 100 },
    {
      field: "duration",
      headerName: "Duration",
      width: 100,
      type: "number",
      valueFormatter: (params: { value: number }) => {
        return Math.floor(params.value / 1000 / 60) + ":" + ((params.value / 1000 / 60) % 60);
      },
    },
    { field: "year", headerName: "Year", width: 100 },
  ];

  /*
  interface ClientSong {
  md5: string;
  name: string;
  path: string;
  duration: number;
  albumArtist: string;
  artists: string[];
  albumName: string;
  genres: string[];
  year: number;
  track: number;
  diskCharacter: number;
  lyrics: string[];
  [key: string]: any;
}
  */

  return (
    <div className="h-full w-full row-start-2 row-span-2">
      <header className="ml-1 mt-1">
        <ul
          key={5}
          className="playlistBar flex mt-1 ml-1 h-[35px] w-full overflow-x-auto relative "
        >
          {playlists.map((playlist: any) => (
            <PlaylistLabel key={playlist.id} playlist={playlist} />
          ))}
        </ul>
      </header>
      <article className="w-full overflow-x-auto h-full mt-2 bg-base-200">
        <header className="w-full flex justify-between">
          {columns.map((column) => (
            <h2 className={""} style={{ flex: column.width }} key={column.field}>
              {column.headerName}
            </h2>
          ))}
        </header>
        {rows &&
          rows.map((row, i) => (
            <div className="flex justify-between">
              {columns.map((column) => (
                <h2 className={""} style={{ flex: column.width }} key={column.field}>
                  {row[column.field]}
                </h2>
              ))}
            </div>
          ))}
      </article>
    </div>
  );
}

export default PlaylistContainer;
