import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ClientSong } from "../redux/reducers/songsReducer";
import TreeView from "@mui/lab/TreeView";
import { TreeItem, TreeItemProps, treeItemClasses } from "@mui/lab";
import AlbumIcon from "@mui/icons-material/Album";
import AlbumTwoToneIcon from "@mui/icons-material/AlbumTwoTone";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import GroupIcon from "@mui/icons-material/Group";
import { alpha, styled } from "@mui/material/styles";
import { TransitionProps } from "@mui/material/transitions";
import { useSpring, animated } from "@react-spring/web";
import { Collapse } from "@mui/material";

type Props = {};

interface GroupedSongs {
  [key: string]: ClientSong[];
}

interface SuperGroupedSongs {
  [key: string]: { [key: string]: ClientSong[] };
}

function Collection({}: Props) {
  const { groupBy, sortBy } = useSelector((state: any) => state.settings);
  const { songs } = useSelector((s: RootState) => s.songs);
  const [groupedSongs, setGroupedSongs] = useState({} as GroupedSongs | SuperGroupedSongs);
  const [icons, setIcons] = useState([] as JSX.Element[][]);

  // all groupBy is going to be doing is:
  //  - take the passed in key
  //  - group by that key

  // sortBy is going to be doing:
  //  - take the passed in key
  //  - sort by that key

  useEffect(() => {
    let groupedSongs: GroupedSongs | SuperGroupedSongs = {};
    console.log(groupBy, songs);
    switch (groupBy) {
      case "artistAlbum":
        groupedSongs = groupSongsBy("albumArtist", songs);
        groupedSongs = groupGroupsOfSongsBy("albumName", groupedSongs);
        break;
      default:
        groupedSongs = groupSongsBy(groupBy, songs);
        break;
    }
    console.log(groupedSongs);
    setGroupedSongs(groupedSongs);
  }, [groupBy, songs]);

  useEffect(() => {
    switch (groupBy) {
      case "artistAlbum":
        setIcons([getIconsByGrouping("albumArtist"), getIconsByGrouping("albumName")]);
        break;
      default:
        console.log(getIconsByGrouping(groupBy));
        setIcons([getIconsByGrouping(groupBy)]);
        break;
    }
  }, [groupBy]);

  function TransitionComponent(props: TransitionProps) {
    const style = useSpring({
      from: {
        opacity: 0,
        transform: "translate3d(20px,0,0)",
      },
      to: {
        opacity: props.in ? 1 : 0,
        transform: `translate3d(${props.in ? 0 : 20}px,0,0)`,
      },
    });

    return (
      <animated.div style={style}>
        <Collapse {...props} />
      </animated.div>
    );
  }

  const StyledTreeItemDashed = styled((props: TreeItemProps) => (
    <TreeItem {...props} TransitionComponent={TransitionComponent} />
  ))(({ theme }) => ({
    [`& .${treeItemClasses.iconContainer}`]: {
      "& .close": {
        opacity: 0.3,
      },
    },
    [`& .${treeItemClasses.group}`]: {
      borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
    [`& .${treeItemClasses.label}`]: {
      fontSize: "10pt !important",
      height: "20px",
    },
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: "0",
    },
  }));

  const StyledTreeItem = styled((props: TreeItemProps) => (
    <TreeItem {...props} TransitionComponent={TransitionComponent} />
  ))(({ theme }) => ({
    [`& .${treeItemClasses.iconContainer}`]: {
      "& .close": {
        opacity: 0.3,
      },
    },
    [`& .${treeItemClasses.group}`]: {
      borderLeft: `0`, //`1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
    [`& .${treeItemClasses.label}`]: {
      fontSize: "10pt !important",
      height: "20px",
    },
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: "0",
    },
  }));

  const StyledTreeItemSong = styled((props: TreeItemProps) => (
    <TreeItem {...props} TransitionComponent={TransitionComponent} />
  ))(({ theme }) => ({
    [`& .${treeItemClasses.iconContainer}`]: {
      "& .close": {
        opacity: 0.3,
      },
    },
    [`& .${treeItemClasses.group}`]: {
      borderLeft: `0`,
      //borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
    [`& .${treeItemClasses.label}`]: {
      fontSize: "10pt !important",
      textWrap: "none",
      overflowX: "auto",
    },
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: "0",
    },
    [`& .${treeItemClasses.iconContainer}`]: {
      display: "none",
    },
  }));

  return (
    <div className="flex-1 overflow-y-hidden">
      <h1>Collection</h1>
      <TreeView
        defaultExpanded={["root"]} /*
        defaultCollapseIcon={<ArrowDownwardOutlined />}
        defaultExpandIcon={<ChevronRightOutlined />} */
        className="justify-self-start"
        multiSelect={false}
      >
        {Object.keys(groupedSongs).map((group) => {
          return (
            <StyledTreeItemDashed
              expandIcon={icons[0][0]}
              collapseIcon={icons[0][1]}
              className="justify-self-start"
              key={group}
              nodeId={group}
              label={group}
            >
              {(!(groupedSongs[group] instanceof Array) &&
                Object.keys(groupedSongs[group]).map((subGroup) => {
                  return (
                    <StyledTreeItem
                      expandIcon={icons[1][0]}
                      collapseIcon={icons[1][1]}
                      key={subGroup}
                      nodeId={subGroup}
                      label={subGroup}
                    >
                      {(groupedSongs as SuperGroupedSongs)[group][subGroup].map(
                        (song: ClientSong) => {
                          return (
                            <StyledTreeItemSong
                              className="!text-sm"
                              key={song.md5}
                              nodeId={song.md5}
                              label={labelFromSong(song)}
                            />
                          );
                        }
                      )}
                    </StyledTreeItem>
                  );
                })) ||
                (groupedSongs[group] as ClientSong[]).map((song: ClientSong) => {
                  return (
                    <StyledTreeItemSong
                      className="text-sm"
                      key={song.md5}
                      nodeId={song.md5}
                      label={song.name}
                    />
                  );
                })}
            </StyledTreeItemDashed>
          );
        })}
      </TreeView>
    </div>
  );
}

function labelFromSong(song: ClientSong): string {
  return `${song.diskCharacter !== 0 ? song.diskCharacter : ""} ${
    song.track !== 0 ? song.track : ""
  } - ${song.name}`;
}

function getIconsByGrouping(groupBy: string): [JSX.Element, JSX.Element] {
  switch (groupBy) {
    case "albumArtist":
      return [<GroupIcon />, <GroupOutlinedIcon />];
    case "albumName":
      return [<AlbumIcon />, <AlbumTwoToneIcon />];
    default:
      return [<ExpandMoreOutlinedIcon />, <ExpandLessOutlinedIcon />];
  }
}

function groupGroupsOfSongsBy(
  key: string,
  songs: GroupedSongs | SuperGroupedSongs
): SuperGroupedSongs {
  if (!(songs[Object.keys(songs)[0]] instanceof Array)) {
    return songs as SuperGroupedSongs;
  }
  return Object.keys(songs).reduce((acc, group) => {
    acc[group] = groupSongsBy(key, songs[group] as ClientSong[]);
    return acc;
  }, {} as SuperGroupedSongs);
}

function groupSongsBy(
  key: string,
  songs: { [key: string]: ClientSong } | ClientSong[]
): { [key: string]: ClientSong[] } {
  return Object.values(songs).reduce((acc, song) => {
    if (!acc[song[key]]) {
      acc[song[key]] = [];
    }
    acc[song[key]].push(song);
    return acc;
  }, {} as GroupedSongs);
}

export default Collection;
