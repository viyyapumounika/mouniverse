import React, { useContext } from "react";
import { WatchlistContext } from "../context/WatchlistContext";

function Watchlist() {
  const { watchlist, removeMovie } = useContext(WatchlistContext);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>❤️ My Watchlist</h2>

      {watchlist.length === 0 ? (
        <p style={{ color: "#aaa" }}>No movies added yet</p>
      ) : (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          {watchlist.map((movie) => (
            <div
              key={movie.id}
              style={{
                width: "180px",
                background: "#1c1c1c",
                borderRadius: "10px",
                padding: "10px",
                textAlign: "center",
                border: "1px solid #333"
              }}
            >

              {/* 🎬 POSTER */}
              <img
                src={
                  movie.poster && movie.poster !== "N/A"
                    ? movie.poster
                    : "https://via.placeholder.com/200x300?text=No+Image"
                }
                alt={movie.title}
                style={{
                  width: "100%",
                  height: "250px",
                  objectFit: "cover",
                  borderRadius: "10px"
                }}
              />

              {/* 🎬 TITLE */}
              <h4 style={{ marginTop: "10px", fontSize: "1rem" }}>
                {movie.title}
              </h4>

              {/* 🎬 BUTTONS */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>

                {/* ▶️ WATCH TRAILER */}
                <button
                  className="btn-watch-trailer"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/results?search_query=${movie.title}+trailer`,
                      "_blank"
                    )
                  }
                >
                  ▶ Watch Trailer
                </button>

                {/* ❌ REMOVE */}
                <button
                  className="btn-remove-watchlist"
                  onClick={() => removeMovie(movie.id)}
                >
                  ❌ Remove
                </button>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;