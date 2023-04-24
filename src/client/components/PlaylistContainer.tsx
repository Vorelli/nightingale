import React from "react";
import { useSelector } from "react-redux";
import PlaylistLabel from "./PlaylistLabel";
import { RootState } from "../redux/store";
import { millisecondsToTime } from "../helpers/time";

type Props = {};

function PlaylistContainer({}: Props) {
  const { playlists, playlistIndex } = useSelector((state: RootState) => state.playlists);
  const { songs } = useSelector((state: RootState) => state.songs);

  const rows = playlists[playlistIndex]?.songs.map((song: string) => songs[song]);
  const columns = [
    //{ field: "track", headerName: "Track", width: 25 },
    { field: "name", headerName: "Title", width: 150 },
    { field: "albumArtist", headerName: "Artist", width: 100 },
    { field: "albumName", headerName: "Album", width: 200 },
    {
      field: "duration",
      headerName: "Duration",
      width: 50,
      type: "number",
      valueFormatter: (params: { value: number }) => {
        return Math.floor(params.value / 1000 / 60) + ":" + ((params.value / 1000 / 60) % 60);
      },
    },
    { field: "year", headerName: "Year", width: 50 },
  ];

  return (
    <div className="h-full w-full row-start-2 row-span-2 flex flex-col">
      <header className="ml-1 mt-1">
        <ul
          key={5}
          className="playlistBar flex mt-1 ml-1 h-[35px] w-full overflow-x-auto relative "
        >
          {typeof playlists === "object" &&
            Object.keys(playlists).map((key: any) => {
              const playlist = playlists[key];
              return <PlaylistLabel key={playlist.id} playlist={playlist} />;
            })}
        </ul>
      </header>
      <article className="w-full overflow-x-auto h-full mt-2 bg-base-200">
        <header className="w-full flex justify-between">
          {columns.map((column) => (
            <h2 className={"text-center"} style={{ flex: column.width }} key={column.field}>
              {column.headerName}
            </h2>
          ))}
        </header>
        {rows &&
          rows.map((row, i) => (
            <div
              className="flex justify-between"
              key={(row && row.md5) || Math.floor(Math.random() * 1000000)}
            >
              {columns.map((column) => (
                <h2 className={"text-center"} style={{ flex: column.width }} key={column.field}>
                  {column.field === "duration"
                    ? millisecondsToTime(row[column.field])
                    : row[column.field]}
                </h2>
              ))}
            </div>
          ))}
      </article>
    </div>
  );
}

export default PlaylistContainer;
