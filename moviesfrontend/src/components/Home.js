import React, { useState } from "react";

const movies = [
  { title: "Avengers", category: "Action" },
  { title: "Frozen", category: "Animation" },
  { title: "Batman", category: "Action" },
  { title: "Interstellar", category: "Sci-Fi" },
];

function Home() {
  const [search, setSearch] = useState("");

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#111", color: "white", minHeight: "100vh", padding: "20px" }}>
      
      <h1>MouniVerse 🎬</h1>

      {/* 🔍 Search Bar */}
      <input
        type="text"
        placeholder="Search movies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "10px",
          width: "300px",
          marginBottom: "20px"
        }}
      />

      {/* 🎥 Categories */}
      <h2>Movies</h2>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {filtered.map((movie, index) => (
          <div key={index} style={{
            background: "#222",
            padding: "20px",
            borderRadius: "10px"
          }}>
            <h3>{movie.title}</h3>
            <p>{movie.category}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Home;