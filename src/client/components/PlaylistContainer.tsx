import React from "react";
import { useSelector, useDispatch } from "react-redux";

type Props = {};

function PlaylistContainer({}: Props) {
  const dispatch = useDispatch();
  const { playlists, loading } = useSelector((state: any) => state.playlists);

  console.log(playlists);

  return <div>PlaylistContainer</div>;
}

export default PlaylistContainer;
