import React, { createContext, useState, useEffect } from "react";

export const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState([]);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  // ✅ Fetch watchlist when app loads or user changes
  useEffect(() => {
    if (user && user.id) {
      fetch(`http://localhost:5000/watchlist/${user.id}`)
        .then(res => res.json())
        .then(data => {
          console.log("WATCHLIST DATA FOR USER:", user.id, data);
          setWatchlist(data);
        })
        .catch(err => console.log("FETCH ERROR:", err));
    } else {
      // Clear watchlist when user logs out
      setWatchlist([]);
    }
  }, [user?.id]); // ✅ Depend on the primitive user.id to prevent infinite loops

  // ✅ ADD MOVIE (FIXED)
 const addMovie = async (movie) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    alert("Please login first");
    return;
  }

  // ✅ CHECK DUPLICATE
  const alreadyExists = watchlist.some(
    (item) => item.movie_id === movie.imdbID
  );

  if (alreadyExists) {
    alert("Already added to Watchlist ⚠️");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/add-to-watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        movie_id: movie.imdbID,
        title: movie.Title,
        poster: movie.Poster,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Added to Watchlist ✅");

      // ✅ update UI
      setWatchlist((prev) => [
        ...prev,
        {
          id: Date.now(),
          user_id: user.id,
          movie_id: movie.imdbID,
          title: movie.Title,
          poster: movie.Poster,
        },
      ]);
    } else {
      alert("Failed to add ❌");
    }

  } catch (err) {
    console.log("ERROR:", err);
  }
};
  // ✅ REMOVE MOVIE
  const removeMovie = async (id) => {
    const user = JSON.parse(localStorage.getItem("user"));

    try {
      const res = await fetch("http://localhost:5000/remove-watchlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          user_id: user.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Update UI
        setWatchlist((prev) =>
          prev.filter((movie) => movie.id !== id)
        );
      }

    } catch (err) {
      console.log("REMOVE ERROR:", err);
    }
  };

  return (
    <WatchlistContext.Provider
      value={{ watchlist, addMovie, removeMovie }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}