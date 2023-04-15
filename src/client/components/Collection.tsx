import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type Props = {};

function Collection({}: Props) {
  const { groupBy, sortBy } = useSelector((state: any) => state.settings);
  const { songs } = useSelector((s: RootState) => s.songs);

  // all groupBy is going to be doing is:
  //  - take the passed in key
  //  - group by that key

  // sortBy is going to be doing:
  //  - take the passed in key
  //  - sort by that key

  const groupedSongs = JSON.parse(JSON.stringify(songs));
  switch (groupBy) {
    case "artistAlbum":
      groupSongsBy("artist", groupedSongs);
      groupSongsBy("album", groupedSongs);
      break;
    default:
      groupSongsBy(groupBy, groupedSongs);
      break;
  }

  return <div>Collection</div>;
}

function groupSongsBy(key: string, songs: any[]) {
  const groupedSongs = Object.values(songs).reduce((acc, song) => {
    if (!acc[song[key]]) {
      acc[song[key]] = [];
    }
    acc[song[key]].push(song);
    return acc;
  }, {});

  console.log(groupedSongs);
}

export default Collection;
