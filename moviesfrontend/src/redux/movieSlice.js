import { createSlice } from "@reduxjs/toolkit";

const movieSlice = createSlice({
  name: "movies",
  initialState: {
    selectedMovie: null,
    watchlist: []
  },
  reducers: {
    selectMovie: (state, action) => {
      state.selectedMovie = action.payload;
    },
    closeMovie: (state) => {
      state.selectedMovie = null;
    },
    addWatchlist: (state, action) => {
      state.watchlist.push(action.payload);
    }
  }
});

export const { selectMovie, closeMovie, addWatchlist } = movieSlice.actions;
export default movieSlice.reducer;