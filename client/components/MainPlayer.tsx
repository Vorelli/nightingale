import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import AlbumArt from "./AlbumArt";
import Collection from "./Collection";
import DesktopWindow from "./DesktopWindow";
import FilterBar from "./FilterBar";
import FirstTimeButton from "./FirstTimeButton";
import MusicPlayer from "./MusicPlayer";
import PlaylistContainer from "./PlaylistContainer";

const MainPlayer = function MainPlayer() {
	const windowName = "main";
	const { hidden } = useSelector(
		(s: RootState) => s.windows.windows[windowName],
	);
	const { currentSong, songs } = useSelector((s: RootState) => s.songs);
	const { status } = useSelector((s: RootState) => s.settings);
	const { audioPlayable } = useSelector((s: RootState) => s.global);
	const song = songs[currentSong || 0];

	return (
		<DesktopWindow
			title={
				"Nightingale " +
					status +
					" " +
					(song &&
						song.albumArtist &&
						song.albumArtist + " - " + song.albumName + " - " + song.name) ||
				"Loading..."
			}
			storeName={windowName}
			id="main-player"
		>
			{(!audioPlayable && <FirstTimeButton />) || <></>}
			{(!hidden && (
				<div className="collection-container flex flex-col row-start-2 col-start-1">
					<FilterBar />
					<Collection />
				</div>
			)) || <></>}
			{(!hidden && <PlaylistContainer />) || <></>}
			<AlbumArt />
			<MusicPlayer />
		</DesktopWindow>
	);
};
//MainPlayer.whyDidYouRender = true;
export default MainPlayer;
