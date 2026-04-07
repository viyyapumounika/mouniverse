import React, { useEffect, useState, useContext } from "react";
import { WatchlistContext } from "../context/WatchlistContext";
import { useNavigate } from "react-router-dom";
import { FaCrown } from "react-icons/fa";

// ✅ Cache variables to prevent fetching local/hidden movies 10+ times on load
let cachedLocalMovies = null;
let cachedHiddenMovies = null;

function MovieRow({ title, search, filter, limit }) {
  const { watchlist, addMovie } = useContext(WatchlistContext);

  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState("");
  const navigate = useNavigate();

  const YOUTUBE_API_KEY = import.meta.env.YOUTUBE_API_KEY; // Make sure to set this in your .env file

  // ✅ Check if already added
  const isAdded =
    selectedMovie &&
    watchlist.some((item) => item.movie_id === selectedMovie.imdbID);

  // 🎬 FETCH MOVIES
  useEffect(() => {
    async function fetchMovies() {
      try {
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=d371de37&s=${search}`
        );
        const data = await res.json();
        let omdbList = (data && data.Search) ? data.Search : [];

        // ✅ Fetch Custom Local Movies
        let localData = [];
        let localList = [];
        try {
          const localRes = await fetch("http://localhost:5000/api/movies");
          localData = await localRes.json();
          if (!cachedLocalMovies) {
            const localRes = await fetch("http://localhost:5000/api/movies");
            cachedLocalMovies = await localRes.json();
          }
          localData = cachedLocalMovies;
          if (Array.isArray(localData)) {
            const matchesSearch = (movie) => {
              const searchLower = search.toLowerCase();
              const typeLower = movie.Type.toLowerCase();
              if (typeLower !== "movie" && typeLower !== "series") {
                // Strict custom category assigned
                return typeLower === searchLower;
              }
              // General category, fallback to Title or exact general type match
              return movie.Title.toLowerCase().includes(searchLower) || typeLower === searchLower;
            };

            localList = localData.filter(matchesSearch);

            // ✅ Filter out OMDB movies that have been moved to another category locally
            omdbList = omdbList.filter(omdbMovie => {
              const localOverride = localData.find(m => m.imdbID === omdbMovie.imdbID);
              if (localOverride) {
                return matchesSearch(localOverride);
              }
              return true;
            });
          }
        } catch (localErr) {
          console.log("Local movies fetch error:", localErr);
        }

        // ✅ Fetch Hidden Movies
        let hiddenList = [];
        try {
          const hiddenRes = await fetch("http://localhost:5000/api/hidden-movies");
          hiddenList = await hiddenRes.json();
          if (!cachedHiddenMovies) {
            const hiddenRes = await fetch("http://localhost:5000/api/hidden-movies");
            cachedHiddenMovies = await hiddenRes.json();
          }
          hiddenList = cachedHiddenMovies;
        } catch (e) {
          console.log("Hidden movies fetch error:", e);
        }

        // ✅ Merge lists: OMDB first, Local second (so local edits overwrite OMDB duplicates)
        let movieList = [...omdbList, ...localList];

        // ✅ Remove duplicate movies based on imdbID
        movieList = Array.from(new Map(movieList.map(m => [m.imdbID, m])).values());

        // ✅ Remove globally deleted movies
        movieList = movieList.filter(m => !hiddenList.includes(m.imdbID));

          if (filter) {
            movieList = movieList.filter((m) =>
              m.Title.toLowerCase().includes(filter.toLowerCase())
            );
          }

          if (limit) movieList = movieList.slice(0, limit);

          setMovies(movieList);
      } catch (err) {
        console.log("Movie fetch error:", err);
      }
    }

    fetchMovies();
  }, [search, filter, limit]);

  // 🎬 FETCH DETAILS + TRAILER
  const handleMovieClick = async (movie, isMoviePremium) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const hasPaidSubscription = user && user.subscription && user.subscription.amount > 0;

    // If the movie is premium and the user does NOT have a paid subscription
    if (isMoviePremium && !hasPaidSubscription) {
      if (window.confirm("This is a premium movie. Subscribe now to watch!")) {
        navigate('/subscription');
      }
      return; // Stop further execution
    }

    // --- Continue to open movie if not blocked ---

    try {
      let selectedData = movie;

      // Only fetch OMDB details if it's NOT a custom local movie
      if (!movie.imdbID.startsWith("custom_")) {
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=d371de37&i=${movie.imdbID}&plot=full`
        );
        selectedData = await res.json();
      } else {
        if (!selectedData.Plot) selectedData.Plot = "A custom movie added by admin.";
      }

      setSelectedMovie(selectedData);

      fetchTrailer(selectedData.Title);

      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        fetch("http://localhost:5000/add-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            title: selectedData.Title,
            poster: selectedData.Poster,
            trailer: `https://www.youtube.com/results?search_query=${selectedData.Title}+trailer`,
          }),
        }).catch(err => console.log("History error:", err));
      }
    } catch (err) {
      console.log("Movie detail error:", err);
    }
  };

  // ✅ ADD TO WATCHLIST (with API call)
  const handleAddToWatchlist = async (movieData) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) {
      alert("Please log in to add movies to your watchlist.");
      return;
    }

    // 1. Optimistically update the UI
    addMovie(movieData);

    // 2. Send data to the backend
    try {
      const response = await fetch("http://localhost:5000/add-to-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          ...movieData, // Backend handles Title, imdbID, Poster, etc.
        }),
      });
      const result = await response.json();
      if (!result.success) {
        alert("Server failed to save movie to watchlist.");
      }
    } catch (error) {
      console.error("Error adding movie to watchlist:", error);
    }
  };

  // ▶️ FETCH TRAILER FROM YOUTUBE API
  const fetchTrailer = async (movieTitle) => {
    try {
      const query = `${movieTitle} official trailer`;

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`
      );

      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;

        setTrailerUrl(
          `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1`
        );
      } else {
        setTrailerUrl("");
      }
    } catch (err) {
      console.log("Trailer fetch error:", err);
    }
  };

  const isSearchResult = title.includes("Search Results");

  return (
    <div className="row">
      <h2 className="row-title">{title}</h2>

      <div className={isSearchResult ? "search-results-grid" : "row-posters"}>
        {movies.map((movie, index) => {
          // Define if the individual movie is premium. Example: Every 3rd movie.
          const isMoviePremium = (index + 1) % 3 === 0;

          return (
            <div
              key={movie.imdbID + index}
              className="poster-container"
              onClick={() => handleMovieClick(movie, isMoviePremium)}
            >
              {isMoviePremium && <div className="premium-icon" style={{background:"red", borderRadius:100}}><FaCrown /></div>}
              <img
                src={
                  movie.Poster && movie.Poster !== "N/A"
                    ? movie.Poster
                    : "https://via.placeholder.com/200x300?text=No+Image"
                }
                alt={movie.Title}
                className="row-poster"
              />
            </div>
          );
        })}
      </div>

      {/* 🎬 MODAL */}
      {selectedMovie && (
        <div className="modal-overlay">
          <div className="modal-content">

            {/* ❌ CLOSE */}
            <span
              className="close-btn"
              onClick={() => {
                setSelectedMovie(null);
                setTrailerUrl("");
              }}
            >
              &times;
            </span>

            {/* 🎬 TRAILER */}
            {trailerUrl ? (
              <iframe
                className="trailer-video"
                src={trailerUrl}
                title="Trailer"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            ) : (
              <p style={{ color: "white", padding: "20px" }}>
                Trailer not available
              </p>
            )}

            {/* 🎬 DETAILS */}
            <div className="modal-details">
              <h2>{selectedMovie.Title}</h2>
              <p><strong>⭐ Rating:</strong> {selectedMovie.imdbRating}</p>
              <p>{selectedMovie.Plot}</p>

              <div className="movie-actions">

                {/* ▶️ OPEN YOUTUBE */}
                <button
                  className="btn-secondary"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/results?search_query=${selectedMovie.Title}+trailer`,
                      "_blank"
                    )
                  }
                >
                  Watch on YouTube
                </button>

                {/* ❤️ WATCHLIST */}
                {isAdded ? (
                  <button className="btn-secondary" disabled>✅ Added</button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => handleAddToWatchlist(selectedMovie)}
                  >
                    ➕ Add to Watchlist
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default MovieRow;