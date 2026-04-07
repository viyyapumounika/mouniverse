import React, { useEffect, useState } from "react";

function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.id) {
      fetch(`http://localhost:5000/history/${user.id}`)
        .then(res => res.json())
        .then(data => {
          const uniqueHistory = [];
          const seen = new Set();

          // Loop backwards to keep the most recently watched movies and filter out older duplicates
          for (let i = data.length - 1; i >= 0; i--) {
            if (!seen.has(data[i].title)) {
              uniqueHistory.push(data[i]);
              seen.add(data[i].title);
            }
          }
          setHistory(uniqueHistory);
        })
        .catch(err => console.error("Error fetching history:", err));
    }
  }, []);

  // 🗑️ REMOVE INDIVIDUAL MOVIE
  const removeHistoryItem = (title) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.id) {
      fetch(`http://localhost:5000/remove-history-item`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, user_id: user.id }),
      })
        .then(res => {
          if (!res.ok) throw new Error("Server responded with an error!");
          return res.json();
        })
        .then(data => {
          if (data.success) {
            setHistory(prevHistory => prevHistory.filter(item => item.title !== title)); // Instantly hide from UI
          } else {
            alert("Failed to remove history item");
          }
        })
        .catch(err => {
          console.error("Error removing history item:", err);
          alert("Action failed! Please make sure you have restarted your backend server.");
        });
    }
  };

  const clearHistory = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.id) {
      if (window.confirm("Are you sure you want to clear your history?")) {
        fetch(`http://localhost:5000/clear-history/${user.id}`, {
          method: "DELETE",
        })
          .then(res => {
            if (!res.ok) throw new Error("Server responded with an error!");
            return res.json();
          })
          .then(data => {
            if (data.success) {
              setHistory([]); // instantly clear the UI
            } else {
              alert("Failed to clear history");
            }
          })
          .catch(err => {
            console.error("Error clearing history:", err);
            alert("Action failed! Please make sure you have restarted your backend server.");
          });
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>🎬 Your History</h2>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            style={{ padding: "8px 16px", background: "#e50914", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            Clear History
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <p>No history found</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {history.map((item, index) => (
            <div key={item.id || index} style={{ position: "relative", width: "180px", background: "#1c1c1c", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
              
              {/* ❌ INDIVIDUAL REMOVE BUTTON */}
              <button
                className="remove-history-btn"
                onClick={() => removeHistoryItem(item.title)}
                title="Remove from history"
              >
                ✕
              </button>

              <img src={item.poster && item.poster !== "N/A" ? item.poster : "https://via.placeholder.com/200x300?text=No+Image"} style={{ width: "100%", height: "250px", objectFit: "cover", borderRadius: "10px" }} alt={item.title} />
              <h4 style={{ marginTop: "10px" }}>{item.title}</h4>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;