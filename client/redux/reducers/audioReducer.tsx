import { createSlice } from "@reduxjs/toolkit";

interface InitialState {
	numBars: number;
}

const initialState: InitialState = {
	numBars: 128,
};

export const audioReducer = createSlice({
	name: "settings",
	initialState,
	reducers: {
		setBars: (state, action) => {
			state.numBars = action.payload;
		},
	},
});

export const { setBars } = audioReducer.actions;

export default audioReducer.reducer;
