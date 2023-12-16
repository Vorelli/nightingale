import { createSlice } from "@reduxjs/toolkit";

interface InitialState {
	groupBy: "albumArtist" | "artistAlbum" | "albumName" | "genres" | "playlist";
	sortBy:
		| "alphaAsc"
		| "alphaDesc"
		| "dateAsc"
		| "dateDesc"
		| "playsAsc"
		| "playsDesc"
		| "ratingAsc"
		| "ratingDesc";
	status: "PAUSED" | "PLAYING";
}

const initialState: InitialState = {
	groupBy: "artistAlbum",
	sortBy: "alphaAsc",
	status: "PLAYING",
};

export const settingsReducer = createSlice({
	name: "settings",
	initialState,
	reducers: {
		setGroupBy: (state, action) => {
			state.groupBy = action.payload.groupBy;
		},
		setSortBy: (state, action) => {
			state.sortBy = action.payload.sortBy;
		},
		setStatus: (state, action) => {
			state.status = action.payload;
		},
	},
});

export const { setSortBy, setStatus, setGroupBy } = settingsReducer.actions;

export default settingsReducer.reducer;
