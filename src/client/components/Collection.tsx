import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { type RootState } from '../redux/store'
import { type ClientSong } from '../redux/reducers/songsReducer'
import TreeView from '@mui/lab/TreeView'
import TreeItem, { type TreeItemProps } from '@mui/lab/TreeItem'
import AlbumIcon from '@mui/icons-material/Album'
import AlbumTwoToneIcon from '@mui/icons-material/AlbumTwoTone'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import GroupIcon from '@mui/icons-material/Group'
import { alpha, styled } from '@mui/material/styles'
import { type TransitionProps } from '@mui/material/transitions'
import { useSpring, animated } from '@react-spring/web'
import Collapse from '@mui/material/Collapse'

interface Props {
  groupBy: string
  sortBy: string
  songs: Record<string, ClientSong>
}

type GroupedSongs = Record<string, ClientSong[]>

type SuperGroupedSongs = Record<string, GroupedSongs>

const InnerCollection = React.memo(function Collection ({
  groupBy,
  sortBy,
  songs
}: Props) {
  const startingGroupedSongs: GroupedSongs | SuperGroupedSongs = {}
  const [groupedSongs, setGroupedSongs] = useState(startingGroupedSongs)
  const [icons, setIcons] = useState([] as JSX.Element[][])
  const collectionList = useRef(null)
  void sortBy.length // need to implement sortBy

  // all groupBy is going to be doing is:
  //  - take the passed in key
  //  - group by that key

  // sortBy is going to be doing:
  //  - take the passed in key
  //  - sort by that key

  useEffect(() => {
    let groupedSongs: GroupedSongs | SuperGroupedSongs = {}
    switch (groupBy) {
      case 'artistAlbum':
        groupedSongs = groupSongsBy('albumArtist', songs)
        groupedSongs = groupGroupsOfSongsBy('albumName', groupedSongs)
        break
      case 'genres':
        groupedSongs = groupSongsBy('genreDic', songs)
        break
      default:
        groupedSongs = groupSongsBy(groupBy, songs)
        break
    }

    setGroupedSongs((cur) => {
      return JSON.stringify(groupedSongs) !== JSON.stringify(cur)
        ? groupedSongs
        : cur
    })
  }, [groupBy, songs])

  useEffect(() => {
    switch (groupBy) {
      case 'artistAlbum':
        setIcons([
          getIconsByGrouping('albumArtist'),
          getIconsByGrouping('albumName')
        ])
        break
      default:
        setIcons([getIconsByGrouping(groupBy)])
        break
    }
  }, [groupBy])

  useEffect(() => {
    window.addEventListener('mousemove', (ev) => {
      let collectionDiv: HTMLDivElement | null = collectionList.current
      if (collectionDiv === null) {
        return
      }
      collectionDiv = collectionDiv as HTMLDivElement
      const temp: DOMRect = collectionDiv.getBoundingClientRect()
      if (collectionList.current !== null) {
        (collectionList.current as HTMLDivElement).style.setProperty(
          '--x',
                    `${ev.clientX - temp.x}px`
        );
        (collectionList.current as HTMLDivElement).style.setProperty(
          '--y',
                    `${ev.clientY - temp.y}px`
        )
      }
    })
  }, [])

  function TransitionComponent (props: TransitionProps): React.JSX.Element {
    const diff = (props.in ?? false)
    const style = useSpring({
      from: {
        opacity: 0,
        transform: 'translate(20px,15px)', // "translate3d(20px,0,0)",
        rotate: '-15deg'
      },
      to: {
        opacity: diff ? 1 : 0,
        transform: `translate(
          ${diff ? 0 : 20}px,
          ${diff ? 0 : 15}px
        )`,
        rotate: `${diff ? 0 : -15}deg`
      }
    })

    return (
            <animated.div style={style}>
                <Collapse {...props} />
            </animated.div>
    )
  }

  const commonStyles = (): any => ({
    '& .MuiTreeItem-iconContainer': {
      '& .close': {
        opacity: 0.3
      }
    },
    '& .MuiTreeItem-group': {
      borderLeft: '0'
    },
    '& .MuiTreeItem-label': {
      fontSize: '9pt !important',
      height: '20px',
      textWrap: 'none',
      overflowX: 'hidden',
      overflowY: 'hidden'
    },
    '& .MuiTreeItem-content': {
      paddingLeft: '0'
    },
    '& .MuiCollapse-root': {
      marginLeft: '5px'
    }
  })

  const StyledTreeItemDashed = styled((props: TreeItemProps) => (
        <TreeItem {...props} TransitionComponent={TransitionComponent} />
  ))(({ theme }) => ({
    ...commonStyles(),
    '& .MuiTreeItem-group': {
      borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`
    }
  }))

  const StyledTreeItem = styled((props: TreeItemProps) => (
        <TreeItem {...props} TransitionComponent={TransitionComponent} />
  ))((/* { theme } */) => commonStyles())

  const StyledTreeItemSong = styled((props: TreeItemProps) => (
        <TreeItem {...props} TransitionComponent={TransitionComponent} />
  ))((/* { theme } */) => ({
    ...commonStyles(),
    '& .MuiTreeItem-iconContainer': {
      display: 'none'
    }
  }))

  function renderSubGroup (
    groupedSongs: SuperGroupedSongs,
    group: string,
    subGroup: string,
    icons: JSX.Element[][]
  ): React.JSX.Element {
    const id = groupedSongs[group][subGroup][0].albumId
    return (
            <StyledTreeItem
                expandIcon={icons[1][0]}
                collapseIcon={icons[1][1]}
                key={id}
                nodeId={id}
                label={subGroup}
            >
                {(groupedSongs[group][subGroup]).map(
                  (song: ClientSong) => (
                        <StyledTreeItemSong
                            className="!text-sm"
                            key={song.md5}
                            nodeId={song.md5}
                            label={labelFromSong(song)}
                        />
                  )
                )}
            </StyledTreeItem>
    )
  }

  const groupToId: Record<string, keyof ClientSong> = {
    artist: 'albumArtistId',
    album: 'albumId'
  }
  function renderGroup (
    groupedSongs: GroupedSongs | SuperGroupedSongs,
    group: string,
    icons: JSX.Element[][]
  ): React.JSX.Element {
    const grouping = groupBy === 'artistAlbum' ? 'artist' : groupBy
    const key =
            groupBy === 'artistAlbum' && Object.keys(groupedSongs[group])[0]
    const id =
            key !== false
              ? (groupedSongs[group] as GroupedSongs)[key][0][
                  groupToId[grouping]
                ]
              : (groupedSongs[group] as ClientSong[])[0][groupToId[grouping]]
    return (
            <StyledTreeItemDashed
                expandIcon={icons[0][0]}
                collapseIcon={icons[0][1]}
                className="justify-self-start"
                key={id}
                nodeId={id}
                label={group}
            >
                {(!(groupedSongs[group].constructor === Array)
                  ? Object.keys(groupedSongs[group]).map((subGroup) =>
                    renderSubGroup(
                      groupedSongs as SuperGroupedSongs,
                      group,
                      subGroup,
                      icons
                    )
                  )
                  : (groupedSongs[group] as ClientSong[]).map(
                      (song: ClientSong) => (
                            <StyledTreeItemSong
                                className="text-sm"
                                key={song.md5}
                                nodeId={song.md5}
                                label={song.name}
                            />
                      )
                    ))}
            </StyledTreeItemDashed>
    )
  }

  function CollectionList ({
    groupedSongs,
    icons
  }: {
    groupedSongs: GroupedSongs | SuperGroupedSongs
    icons: JSX.Element[][]
  }): React.JSX.Element {
    const [nodes, setNodes] = useState(new Array<string>())
    void nodes
    const { hidden } = useSelector(
      (s: RootState) => s.windows.windows.main
    )

    useEffect(() => {
      const nodes = JSON.parse(localStorage.getItem('nodes') ?? '[]')
      if (!hidden && nodes.length > 0) {
        setNodes(nodes)
      }
    }, [])

    return (
            <div
                ref={collectionList}
                className="collectionList flex-1 overflow-x-hidden overflow-y-hidden w-full scroll-smooth scroll-m-44 text-xs"
                style={{ maxWidth: '100%', maxHeight: 'calc(100% - 60px)' }}
            >
                <TreeView
                    disableSelection={true}
                    expanded={[] /* nodes */}
                    onNodeToggle={undefined/* (_ev, nodeIds) => {
                      localStorage.setItem('nodes', JSON.stringify(nodeIds))
                      setNodes(nodeIds)
                    } */}
                    className="justify-self-start"
                    multiSelect={false}
                    sx={{ height: '80%', width: '100%', maxHeight: '80%' }}
                >
                    {Object.keys(groupedSongs).map((group) =>
                      renderGroup(groupedSongs, group, icons)
                    )}
                </TreeView>
            </div>
    )
  }
  CollectionList.whyDidYouRender = true

  return <CollectionList groupedSongs={groupedSongs} icons={icons} />
})

function labelFromSong (song: ClientSong): string {
  return `${song.track !== 0 ? song.track : ''} - ${song.name}`
}

function getIconsByGrouping (groupBy: string): [JSX.Element, JSX.Element] {
  switch (groupBy) {
    case 'albumArtist':
      return [<GroupIcon key ="Group Icon" />, <GroupOutlinedIcon key ="Group Outlined Icon" />]
    case 'albumName':
      return [<AlbumIcon key ="Album Icon" />, <AlbumTwoToneIcon key ="Album Two Tone Icon" />]
    default:
      return [<ExpandMoreOutlinedIcon key ="ExpandedMore Icon" />, <ExpandLessOutlinedIcon key ="ExpandLessOutlined Icon" />]
  }
}

function groupGroupsOfSongsBy (
  key: string,
  songs: GroupedSongs | SuperGroupedSongs
): SuperGroupedSongs {
  if (!(songs[Object.keys(songs)[0]] instanceof Array)) {
    return songs as SuperGroupedSongs
  }
  return Object.keys(songs).reduce<SuperGroupedSongs>((acc, group) => {
    acc[group] = groupSongsBy(key, songs[group] as ClientSong[])
    return acc
  }, {})
}

function insertIntoSorted (arr: ClientSong[], value: ClientSong): void {
  let l = 0
  let r = arr.length
  while (l < r) {
    const m = Math.floor((r - l) / 2) + l
    if (arr[m].track < value.track) {
      l = m + 1
    } else {
      r = m
    }
  }
  arr.splice(l, 0, value)
}

function groupSongsBy (
  key: string,
  songs: Record<string, ClientSong> | ClientSong[]
): Record<string, ClientSong[]> {
  return Object.values(songs).reduce<GroupedSongs>((acc, song) => {
    if (acc[song[key]] === undefined) { acc[song[key]] = [] }
    insertIntoSorted(acc[song[key]], song)
    return acc
  }, {})
}

function Collection (): React.JSX.Element {
  const { groupBy, sortBy } = useSelector((state: any) => state.settings)
  const { songs } = useSelector((s: RootState) => s.songs)

  return <InnerCollection songs={songs} groupBy={groupBy} sortBy={sortBy} />
}
// InnerCollection.whyDidYouRender = true;

export default Collection
