import React, { useState } from "react";

function Settings() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [password, setPassword] = useState("");

  const updatePassword = () => {
    fetch("http://localhost:5000/update-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user.id,
        password,
      }),
    })
      .then(res => res.json())
      .then(() => alert("Password updated ✅"));
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
      <div style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", maxWidth: "380px", width: "100%", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        
        <div style={{ textAlign: "left", marginBottom: "15px" }}>
          <label style={{ display: "block", color: "#aaa", marginBottom: "5px", fontSize: "0.9rem" }}>Username</label>
          <input 
            type="text" 
            value={user.name} 
            disabled 
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#222", color: "#888", outline: "none", boxSizing: "border-box" }} 
          />
        </div>
        
        <div style={{ textAlign: "left", marginBottom: "25px" }}>
          <label style={{ display: "block", color: "#aaa", marginBottom: "5px", fontSize: "0.9rem" }}>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#111", color: "#fff", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <p style={{ fontSize: "1.1rem", color: "#fff", margin: "0 0 20px 0", fontWeight: "500" }}>
          Are you sure you want to update your password?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button 
            onClick={updatePassword}
            style={{ width: "100%", fontSize: "1rem", padding: "10px 0", borderRadius: "6px", background: "#e50914", color: "#fff", border: "none", cursor: "pointer", fontWeight: "600" }}
          >
            Yes
          </button>
          <button 
            onClick={() => setPassword("")}
            style={{ width: "100%", fontSize: "1rem", padding: "10px 0", borderRadius: "6px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", cursor: "pointer", fontWeight: "500" }}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;