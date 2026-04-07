import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSearch, FaHeart } from "react-icons/fa";

function Navbar({ search, setSearch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserName, setShowUserName] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [editNameMode, setEditNameMode] = useState(false);
  const [editPasswordMode, setEditPasswordMode] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedPassword, setEditedPassword] = useState("");
  const [editedPasswordConfirm, setEditedPasswordConfirm] = useState("");
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // A user is "subscribed" if they have a plan with a cost greater than 0.
  const isSubscribed = user && user.subscription && user.subscription.amount > 0;

  // Initialize edit fields when settings open
  useEffect(() => {
    if (showSettings) {
      setEditedName(user.name || "");
      setEditedPassword("");
      setEditedPasswordConfirm("");
      setEditNameMode(false);
      setEditPasswordMode(false);
    }
  }, [showSettings, user.name]);
  useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenu(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  const handleLogout = () => {
    localStorage.removeItem("login");
    localStorage.removeItem("user");
    window.location.reload();
  };

  // ✅ Handle Update Profile
  const handleUpdateProfile = async (updateType) => {
    if (updateType === "name") {
      if (!editedName.trim()) {
        alert("❌ Name cannot be empty");
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/update-profile/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editedName,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const updatedUser = { ...user, name: editedName };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          alert("✅ Username updated successfully");
          setEditNameMode(false);
        } else {
          alert("❌ Failed to update username: " + data.message);
        }
      } catch (err) {
        console.log("ERROR:", err);
        alert("❌ Server error");
      }
    } else if (updateType === "password") {
      if (!editedPassword) {
        alert("❌ Password cannot be empty");
        return;
      }

      if (editedPassword !== editedPasswordConfirm) {
        alert("❌ Passwords do not match");
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/update-profile/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: editedPassword,
          }),
        });

        const data = await res.json();
        if (data.success) {
          alert("✅ Password updated successfully");
          setEditedPassword("");
          setEditedPasswordConfirm("");
          setEditPasswordMode(false);
        } else {
          alert("❌ Failed to update password: " + data.message);
        }
      } catch (err) {
        console.log("ERROR:", err);
        alert("❌ Server error");
      }
    }
  };

  // ✅ CLOSE ON ESC KEY
  useEffect(() => {
    function handleEsc(event) {
      if (event.key === "Escape") {
        setShowSettings(false);
        setShowDeleteConfirm(false);
        setShowLogoutConfirm(false);
      }
    }

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // ✅ If on admin page, render an Admin Navbar heading instead
  if (location.pathname.toLowerCase().includes("admin")) {
    return (
      <>
        <div className="navbar">
          <div className="nav-left">
            <h1 className="logo">ADMIN DASHBOARD</h1>
          </div>
          <div className="nav-right">
            <button className="login-btn" onClick={() => setShowLogoutConfirm(true)}>
              Logout
            </button>
          </div>
        </div>

        {/* 🚪 SIGN OUT CONFIRM MODAL */}
        {showLogoutConfirm && (
          <div className="modal-overlay">
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", maxWidth: "350px" }}>
              <p style={{ fontSize: "1.2rem", color: "#fff", margin: "0 0 20px 0", fontWeight: "500" }}>
                Are you sure you want to sign out?
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
                <button 
                  className="btn-danger" 
                  onClick={handleLogout}
                  style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px" }}
                >
                  Yes
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px" }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="navbar">

      {/* LEFT */}
      <div className="nav-left">
        <h1 className="logo">MOUNIVERSE</h1>
      </div>

      {/* THE HAMBURGER ICON */}
      <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? "✖" : "☰"}
      </button>

      {/* WRAPPER FOR MOBILE MENU */}
      <div className={`nav-wrapper ${isMenuOpen ? "active" : ""}`}>

      {/* CENTER */}
      <div className="nav-center">
        <div
          className="search-container active"
        >
          {/* ICON */}
          <span className="search-icon">
            <FaSearch/>
          </span>

          {/* INPUT */}
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        {isSubscribed ? (
          <button className="login-btn" disabled style={{ backgroundColor: '#2a2a2a', cursor: 'not-allowed' }}>
            Subscribed
          </button>
        ) : (
          <button className="login-btn" onClick={() => navigate("/subscription")}>
            Subscription Plans
          </button>
        )}
        <button
          className="watchlist-btn"
          title="Watchlist"
          onClick={() => navigate("/watchlist")}
        >
          <FaHeart style={{color:'red'}}/>
        </button>

        {/* PROFILE */}
       

<div ref={menuRef}
  style={{ position: "relative", cursor: "pointer" }}
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
    alt="profile"
    style={{ width: "35px", height: "35px" }}
    onClick={() => setShowMenu(!showMenu)}
  />

  {showMenu && (
    <div className="profile-menu">
      <p style={{ fontWeight: "bold", marginBottom: "10px", borderBottom: "1px solid #ccc", paddingBottom: "8px" }}>
        👤 {user.name || "User"}
      </p>
      <p
  onClick={() => {
    const user = JSON.parse(localStorage.getItem("user"));

    fetch(`http://localhost:5000/history/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("HISTORY DATA:", data); // ✅ debug
        navigate("/history");
      })
      .catch((err) => console.log("History fetch error:", err));

    setShowMenu(false);
  }}
>
  📜 History
</p>
      <p onClick={() => { navigate("/subscription"); setShowMenu(false); }}>⬆️ Upgrade Plan</p>
      <p onClick={() => { setShowSettings(true); setShowMenu(false); }}>⚙️ Settings</p>
      <p onClick={() => { setShowLogoutConfirm(true); setShowMenu(false); }}>🚪 Sign Out</p>
    </div>
  )}
</div>
      </div>
      
      </div>

      <style>{`
        .watchlist-btn {
          background: transparent;
          border: none;
          font-size: 1.75rem; /* Increased heart size */
          cursor: pointer;
          padding: 0;
        }
        /* ⚙️ Settings & Delete Modal Professional Styles */
        .settings-modal-content {
          background: #181818 !important;
          color: #fff !important;
          border-radius: 12px !important;
          width: 90% !important;
          max-width: 450px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8) !important;
          border: 1px solid #333 !important;
          animation: modalFadeIn 0.3s ease !important;
          padding: 0 !important;
          display: flex;
          flex-direction: column;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #141414;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #888;
          font-size: 1.5rem;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
          line-height: 1;
        }
        .close-btn:hover { color: #fff; }

        .modal-body {
          padding: 24px;
          background: #181818;
        }

        .settings-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #2a2a2a;
        }
        .settings-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-label {
          font-size: 0.85rem;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .section-value {
          font-size: 1.1rem;
          font-weight: 500;
          color: #eee;
        }

        .edit-icon-btn {
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        .edit-icon-btn:hover { background: #3a3a3a; border-color: #555; }

        .section-input {
          width: 100%;
          padding: 12px 14px;
          background: #111;
          border: 1px solid #333;
          border-radius: 6px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .section-input:focus { border-color: #e50914; box-shadow: 0 0 0 2px rgba(229, 9, 20, 0.2); }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .btn-small-secondary, .btn-secondary, .cancel-btn {
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #444;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          flex: 1;
          text-align: center;
        }
        .btn-small-secondary:hover, .btn-secondary:hover, .cancel-btn:hover { background: #3a3a3a; border-color: #555; }

        .btn-small-primary {
          background: #e50914;
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
          flex: 1;
        }
        .btn-small-primary:hover { background: #f40612; }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #333;
          display: flex;
          justify-content: flex-end;
          background: #141414;
          gap: 12px;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }

        .delete-warning-box {
          background: rgba(229, 9, 20, 0.1);
          border: 1px solid rgba(229, 9, 20, 0.3);
          border-left: 4px solid #e50914;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 24px;
        }
        .warning-icon { font-size: 1.8rem; margin: 0 0 8px 0; }
        .warning-title { font-weight: 600; color: #e50914; margin: 0 0 6px 0; font-size: 1.1rem; }
        .warning-text { margin: 0; color: #ccc; font-size: 0.95rem; line-height: 1.5; }

        .account-info-box {
          background: #111;
          border: 1px solid #333;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 24px;
        }
        .info-label { margin: 0 0 12px 0; color: #888; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95rem; }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label { color: #aaa; }
        .detail-value { font-weight: 500; color: #fff; }

        .confirm-section {
          background: #1a1a1a;
          padding: 16px;
          border-radius: 6px;
          border: 1px dashed #333;
        }
        .confirm-text { margin: 0; color: #bbb; text-align: center; font-size: 0.95rem; line-height: 1.5; }

        .btn-danger, .delete-btn {
          background: #e50914;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn-danger:hover, .delete-btn:hover { background: #b20710; }
      `}</style>

      {/* ⚙️ SETTINGS MODAL */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", maxWidth: "380px" }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#fff", fontSize: "1.5rem" }}>⚙️ Settings</h2>

            <div style={{ textAlign: "left", marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "5px", fontSize: "0.9rem" }}>Username</label>
              <input 
                type="text" 
                value={editedName} 
                onChange={(e) => setEditedName(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#222", color: "#fff", outline: "none", boxSizing: "border-box" }} 
              />
            </div>
            
            <div style={{ textAlign: "left", marginBottom: "15px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "5px", fontSize: "0.9rem" }}>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                onChange={(e) => setEditedPassword(e.target.value)}
                value={editedPassword}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#111", color: "#fff", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ textAlign: "left", marginBottom: "25px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "5px", fontSize: "0.9rem" }}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                onChange={(e) => setEditedPasswordConfirm(e.target.value)}
                value={editedPasswordConfirm}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#111", color: "#fff", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <p style={{ fontSize: "1.1rem", color: "#fff", margin: "0 0 20px 0", fontWeight: "500" }}>
              Are you sure you want to save changes?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button 
                onClick={() => {
                  if (editedName && editedName !== user.name) handleUpdateProfile("name");
                  if (editedPassword) handleUpdateProfile("password");
                }}
                style={{ width: "100%", fontSize: "1rem", padding: "10px 0", borderRadius: "6px", background: "#e50914", color: "#fff", border: "none", cursor: "pointer", fontWeight: "600" }}
              >
                Yes
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                style={{ width: "100%", fontSize: "1rem", padding: "10px 0", borderRadius: "6px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", cursor: "pointer", fontWeight: "500" }}
              >
                No
              </button>
              <button 
                onClick={() => { setShowSettings(false); setShowDeleteConfirm(true); }}
                style={{ width: "100%", fontSize: "1rem", padding: "10px 0", borderRadius: "6px", background: "transparent", color: "#e50914", border: "1px solid #e50914", cursor: "pointer", fontWeight: "600", marginTop: "10px" }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ DELETE ACCOUNT MODAL */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", maxWidth: "380px" }}>
            
            <p style={{ margin: "0 0 8px 0", color: "#ccc", fontSize: "1rem" }}><strong style={{ color: "#fff" }}>Username:</strong> {user.name}</p>
            <p style={{ margin: "0 0 20px 0", color: "#ccc", fontSize: "1rem" }}><strong style={{ color: "#fff" }}>Password:</strong> ••••••••</p>

            <p style={{ fontSize: "1.1rem", color: "#fff", margin: "0 0 20px 0", fontWeight: "500" }}>
              Are you sure you want to delete this account?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <button 
                className="btn-danger" 
                onClick={async () => {
                  try {
                    const res = await fetch(`http://localhost:5000/delete-account/${user.id}`, {
                      method: "DELETE"
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert("Account deleted successfully");
                      localStorage.removeItem("login");
                      localStorage.removeItem("user");
                      window.location.reload();
                    } else {
                      alert("Failed to delete account");
                    }
                  } catch (err) {
                    console.log("ERROR:", err);
                    alert("Server error");
                  }
                }}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px" }}
              >
                Yes
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px" }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚪 SIGN OUT CONFIRM MODAL */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", maxWidth: "350px" }}>
            <p style={{ fontSize: "1.2rem", color: "#fff", margin: "0 0 20px 0", fontWeight: "500" }}>
              Are you sure you want to sign out?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <button 
                className="btn-danger" 
                onClick={handleLogout}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px" }}
              >
                Yes
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px" }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;