import React, { useEffect } from "react";
import {
  ClientPlaylist,
  changePlaylistName,
  deletePlaylist,
  setPlaylistIndex,
} from "../redux/reducers/playlistsReducer";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDispatch } from "react-redux";

type Props = {
  playlist: ClientPlaylist;
};

function PlaylistLabel(props: Props) {
  const [lastClick, setLastClick] = React.useState<undefined | Date>(undefined);
  const dispatch = useDispatch();
  const [currentName, setCurrentName] = React.useState<string>(props.playlist.name);
  const [editing, setEditing] = React.useState<boolean>(false);

  useEffect(() => {
    if (editing) {
      setCurrentName(props.playlist.name);
    }
  }, [editing]);

  function handleClick(ev: React.MouseEvent) {
    console.log("now", "hi");
    const now = new Date();
    setLastClick(now);
    if (lastClick !== undefined) {
      const diff = now.getTime() - lastClick?.getTime();
      console.log("diff", diff);
      if (diff && diff < 500) {
        //double click... should rename the label now.
        setEditing(true);
        return;
      }
    }
    //single click. should set the playlist Index to this one.
    dispatch(setPlaylistIndex(props.playlist.id));
  }

  function handleNameChange() {
    dispatch(changePlaylistName({ id: props.playlist.id, name: currentName }));
    setEditing(false);
  }

  function handleDeleteClick(ev: React.MouseEvent) {
    dispatch(deletePlaylist(props.playlist.id));
  }

  return (
    <li className="playlistLabel hover:before:opacity-0 before:transition-all before:duration-500 hover:shadow-base-100 transition-all hover:shadow-lg rounded-[5px] before:rounded-[5px] text-neutral-content shadow shadow-neutral-focus border-primary border-solid m-[1px] w-fit max-h-[35px] h-[30px] bg-secondary relative z-10 before:z-[-10] border-[1px] border-transparent before:w-full before:bg-base-100 before:absolute before:h-full before:left-0 flex">
      {(editing && (
        <input
          onBlur={(ev) => handleNameChange()}
          onSubmit={(ev) => handleNameChange()}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              handleNameChange();
            } else if (ev.key === "Escape") {
              setEditing(false);
            }
          }}
          type="text"
          className="w-fit h-fit"
          value={currentName}
          onChange={(ev) => setCurrentName(ev.target.value)}
        />
      )) || (
        <p className="overflow-y-hidden" onClick={(ev) => handleClick(ev)}>
          {props.playlist.name} ({props.playlist.songs.length})
        </p>
      )}
      <IconButton onClick={handleDeleteClick} sx={{ padding: "0", float: "right" }}>
        <CloseIcon />
      </IconButton>
    </li>
  );
}

export default PlaylistLabel;
