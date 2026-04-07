import React, { useContext } from "react";
import { WatchlistContext } from "../context/WatchlistContext";

function Watchlist() {

  const { watchlist, removeMovie } = useContext(WatchlistContext);

  return (
    <div>
      <h1>My Watchlist</h1>
      
      {watchlist.map(movie => (
        <div className="watchlist-card" key={movie.id}>
          <img 
            src={movie.poster && movie.poster !== "N/A" 
              ? movie.poster 
              : "https://via.placeholder.com/200x300"} 
            alt={movie.title}
            style={{ width: "150px", borderRadius: "10px" }}
          />
          
          <h3>{movie.title}</h3>
          
          <button
            onClick={() =>
              window.open(
                `https://www.youtube.com/results?search_query=${movie.title}+trailer`,
                "_blank"
              )
            }
          >
            Watch Trailer
          </button>
          
          <button onClick={() => removeMovie(movie.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default Watchlist;