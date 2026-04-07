import React, { useContext } from "react";
import { WatchlistContext } from "../context/WatchlistContext";

export default function MovieCard({ movie, openMovie }) {

  const { addMovie } = useContext(WatchlistContext);

const handleMovieClick = (movie) => {
  const userString = localStorage.getItem("user");
  if (!userString) return;

  const user = JSON.parse(userString);

  fetch("http://localhost:5000/add-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      title: movie.Title,
      poster: movie.Poster,
      trailer: `https://www.youtube.com/results?search_query=${movie.Title}+trailer`,
    }),
  }).catch((err) => console.log("Failed to add history", err));

  if (openMovie) {
    openMovie(movie.imdbID);
  }
};
  return (
    <div
      className="movie-card"
      onClick={() => handleMovieClick(movie)}
      // onClick={() => openMovie(movie.imdbID)}
    >

      <img src={movie.Poster && movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/200x300?text=No+Image"} alt={movie.Title} />

      <p>{movie.Title}</p>

      {/* ⭐ Add Watchlist Button */}
      <button
        className="watchlist-btn"
        onClick={(e) => {
          e.stopPropagation(); // ❗ prevents card click
          addMovie(movie);
        }}
      >
        ❤️ Add to Watchlist
        
      </button>

    </div>
  );
}