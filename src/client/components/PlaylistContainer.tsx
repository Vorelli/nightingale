import React from "react";
import { useSelector } from "react-redux";
import PlaylistLabel from "./PlaylistLabel";
import { RootState } from "../redux/store";
import PlaylistDisplay from "./PlaylistDisplay";

type Props = {};

function PlaylistContainer({}: Props) {
    const { playlists, playlistIndex } = useSelector(
        (state: RootState) => state.playlists
    );
    const { songs } = useSelector((state: RootState) => state.songs);

    const rows = playlists[playlistIndex]?.songs.map(
        (song: string) => songs[song]
    );

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
                            return (
                                <PlaylistLabel
                                    key={playlist.id}
                                    playlist={playlist}
                                />
                            );
                        })}
                </ul>
            </header>
            <PlaylistDisplay rows={rows} />
        </div>
    );
}

export default PlaylistContainer;
