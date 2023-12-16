import React from "react";
import { millisecondsToTime } from "../helpers/time";
import { ClientSong } from "../redux/reducers/songsReducer";

interface Props {
	rows: ClientSong[];
}

interface Column {
	field: string;
	headerName: string;
	width: number;
}

const PlaylistDisplay = ({ rows }: Props) => {
	const columns = [
		//{ field: "track", headerName: "Track", width: 25 },
		{ field: "name", headerName: "Title", width: 150 },
		{ field: "albumArtist", headerName: "Artist", width: 75 },
		{ field: "albumName", headerName: "Album", width: 200 },
		{
			field: "duration",
			headerName: "Duration",
			width: 50,
			type: "number",
			valueFormatter: (params: { value: number }) => {
				return (
					Math.floor(params.value / 1000 / 60) +
					":" +
					((params.value / 1000 / 60) % 60)
				);
			},
		},
		{ field: "year", headerName: "Year", width: 50 },
	];

	function mapHeaders(column: Column) {
		return (
			<h2
				className={"text-center"}
				style={{ flex: column.width }}
				key={column.field}
			>
				{column.headerName}
			</h2>
		);
	}

	function mapSongsByColumnField(
		column: Column,
		row: ClientSong,
	): (React.ReactElement | null)[] {
		return (
			(row && row[column.field] && (
				<h2
					className={"text-center overflow-x-hidden overflow-y-auto h-full"}
					style={{
						flex: column.width,
					}}
					key={column.field}
				>
					{column.field === "duration"
						? millisecondsToTime(row[column.field])
						: row[column.field]}
				</h2>
			)) ||
			null
		);
	}

	function mapSong(row: ClientSong) {
		return (
			row && (
				<div className="flex h-4 justify-between" key={row.md5}>
					{columns
						.map((c) => mapSongsByColumnField(c, row))
						.filter((v) => v !== null)}
				</div>
			)
		);
	}

	return (
		<article className="w-full text-xs overflow-x-auto h-full mt-2 bg-base-200">
			<header className="w-full h-4 flex justify-between">
				{columns.map(mapHeaders)}
			</header>
			{rows && rows.map(mapSong)}
		</article>
	);
};

export default PlaylistDisplay;
