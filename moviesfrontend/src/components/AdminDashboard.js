import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMovies } from "../services/api";
import "./SubscriptionPlan.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6666', '#e50914'];

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("statistics");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [showEditMovieModal, setShowEditMovieModal] = useState(false);
  const [showDeleteMovieConfirm, setShowDeleteMovieConfirm] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [newMovie, setNewMovie] = useState({ title: "", year: "", type: "movie", poster: "", plot: "" });
  const [movieToEdit, setMovieToEdit] = useState(null);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [movieSearchQuery, setMovieSearchQuery] = useState("");
  const [adminMovies, setAdminMovies] = useState([]);
  const [defaultAdminMovies, setDefaultAdminMovies] = useState([]);
  const [loadingAdminMovies, setLoadingAdminMovies] = useState(false);

  // ✅ Trending Section States
  const [trendingSearchQuery, setTrendingSearchQuery] = useState("");
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [defaultTrendingMovies, setDefaultTrendingMovies] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // ✅ Subscription Plans States
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);

  // ✅ Statistics States
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
        setShowDeleteConfirm(false);
        setShowAddMovieModal(false);
        setShowEditMovieModal(false);
        setShowDeleteMovieConfirm(false);
        setShowEditPlanModal(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch('http://localhost:5000/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      setLoadingUsers(false);
    };

    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab, users.length]);

  // ✅ Fetch Statistics when tab is opened
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const response = await fetch('http://localhost:5000/api/statistics');
        const data = await response.json();
        if (data.success) setStats(data.stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
      setLoadingStats(false);
    };

    if (activeTab === 'statistics' && !stats) {
      fetchStats();
    }
  }, [activeTab, stats]);

  // ✅ Fetch Subscription Plans when tab is opened
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const response = await fetch('http://localhost:5000/api/plans');
        const data = await response.json();
        if (Array.isArray(data)) setPlans(data);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
      setLoadingPlans(false);
    };

    if (activeTab === 'subscriptions' && plans.length === 0) {
      fetchPlans();
    }
  }, [activeTab, plans.length]);

  // Fetch a large default catalog of all categories when the movies tab is opened
  useEffect(() => {
    if (activeTab === 'movies' && defaultAdminMovies.length === 0) {
      const fetchAllCategories = async () => {
        setLoadingAdminMovies(true);
        try {
          const categories = ["action", "comedy", "sci-fi", "horror", "animation", "thriller", "romance", "avengers"];
          const promises = categories.map(cat => fetchMovies(cat));
          const results = await Promise.all(promises);
          const combinedOmdb = results.flat().filter(Boolean);

          // ✅ Fetch Custom Local Movies
          let localList = [];
          try {
            const localRes = await fetch("http://localhost:5000/api/movies");
            localList = await localRes.json();
            if (!Array.isArray(localList)) localList = [];
          } catch (e) { console.error("Local fetch error:", e); }

          // Merge: OMDB first, Local second (so local edits override OMDB)
          const allCombined = [...combinedOmdb, ...localList];

          // Remove duplicate movies based on imdbID
          let uniqueMovies = Array.from(new Map(allCombined.map(m => [m.imdbID, m])).values());

          // ✅ Filter out globally deleted movies
          try {
            const hiddenRes = await fetch("http://localhost:5000/api/hidden-movies");
            const hiddenList = await hiddenRes.json();
            uniqueMovies = uniqueMovies.filter(m => !hiddenList.includes(m.imdbID));
          } catch(e) {}

          setDefaultAdminMovies(uniqueMovies);
          if (!movieSearchQuery.trim()) {
            setAdminMovies(uniqueMovies);
          }
        } catch (error) {
          console.error("Error fetching default movies:", error);
        }
        setLoadingAdminMovies(false);
      };
      fetchAllCategories();
    }
  }, [activeTab]);

  // ✅ Fetch trending movies when the trending tab is opened
  useEffect(() => {
    if (activeTab === 'trending' && defaultTrendingMovies.length === 0) {
      const fetchTrending = async () => {
        setLoadingTrending(true);
        try {
          const results = await fetchMovies("avengers");
          let combinedOmdb = results || [];

          let localData = [];
          let localList = [];
          try {
            const localRes = await fetch("http://localhost:5000/api/movies");
            localData = await localRes.json();
            if (Array.isArray(localData)) {
              localList = localData.filter(m => m.Type.toLowerCase() === "avengers");

              combinedOmdb = combinedOmdb.filter(omdbMovie => {
                const localOverride = localData.find(m => m.imdbID === omdbMovie.imdbID);
                if (localOverride) {
                  return localOverride.Type.toLowerCase() === "avengers";
                }
                return true;
              });
            }
          } catch (e) { console.error("Local fetch error:", e); }

          const allCombined = [...combinedOmdb, ...localList];
          let uniqueMovies = Array.from(new Map(allCombined.map(m => [m.imdbID, m])).values());

          try {
            const hiddenRes = await fetch("http://localhost:5000/api/hidden-movies");
            const hiddenList = await hiddenRes.json();
            uniqueMovies = uniqueMovies.filter(m => !hiddenList.includes(m.imdbID));
          } catch(e) {}

          setDefaultTrendingMovies(uniqueMovies);
          if (!trendingSearchQuery.trim()) {
            setTrendingMovies(uniqueMovies);
          }
        } catch (error) {
          console.error("Error fetching trending movies:", error);
        }
        setLoadingTrending(false);
      };
      fetchTrending();
    }
  }, [activeTab, defaultTrendingMovies.length, trendingSearchQuery]);

  // ✅ Client-side Real-time search for trending section
  useEffect(() => {
    if (activeTab !== 'trending') return;

    if (!trendingSearchQuery.trim()) {
      setTrendingMovies(defaultTrendingMovies);
    } else {
      const lowerQuery = trendingSearchQuery.toLowerCase();
      const filtered = defaultTrendingMovies.filter(m => 
        m.Title.toLowerCase().includes(lowerQuery)
      );
      setTrendingMovies(filtered);
    }
  }, [trendingSearchQuery, defaultTrendingMovies, activeTab]);

  // Real-time search with debounce
  useEffect(() => {
    if (activeTab !== 'movies') return;

    const delayDebounceFn = setTimeout(async () => {
      if (!movieSearchQuery.trim()) {
        // If search is cleared, restore all categories instantly from cache
        if (defaultAdminMovies.length > 0) setAdminMovies(defaultAdminMovies);
      } else {
        // Parallel check/search as user types
        setLoadingAdminMovies(true);
        try {
          const results = await fetchMovies(movieSearchQuery);
          let omdbResults = results || [];

          // ✅ Fetch Custom Local Movies for Search
          let localData = [];
          let localList = [];
          try {
            const localRes = await fetch("http://localhost:5000/api/movies");
            localData = await localRes.json();
            if (Array.isArray(localData)) {
              localList = localData.filter(m => 
                m.Title.toLowerCase().includes(movieSearchQuery.toLowerCase()) || 
                m.Type.toLowerCase() === movieSearchQuery.toLowerCase()
              );

              // Remove OMDB result if it's been edited locally to no longer match this search
              omdbResults = omdbResults.filter(omdbMovie => {
                const localOverride = localData.find(m => m.imdbID === omdbMovie.imdbID);
                if (localOverride) {
                  return localOverride.Title.toLowerCase().includes(movieSearchQuery.toLowerCase()) ||
                         localOverride.Type.toLowerCase() === movieSearchQuery.toLowerCase();
                }
                return true;
              });
            }
          } catch (e) { console.error("Local fetch error:", e); }

          // Merge: OMDB first, Local second
          const allCombined = [...omdbResults, ...localList];
          let uniqueResults = Array.from(new Map(allCombined.map(m => [m.imdbID, m])).values());

          // ✅ Filter out globally deleted movies
          try {
            const hiddenRes = await fetch("http://localhost:5000/api/hidden-movies");
            const hiddenList = await hiddenRes.json();
            uniqueResults = uniqueResults.filter(m => !hiddenList.includes(m.imdbID));
          } catch(e) {}

          setAdminMovies(uniqueResults);
        } catch (error) {
          console.error("Error fetching movies:", error);
        }
        setLoadingAdminMovies(false);
      }
    }, 400); // 400ms delay to wait for user to finish typing before fetching

    return () => clearTimeout(delayDebounceFn);
  }, [movieSearchQuery, activeTab, defaultAdminMovies]);

  // Manual force search (optional fallback if user clicks the search button)
  const handleSearchMovies = () => {
    if (!movieSearchQuery.trim()) setAdminMovies(defaultAdminMovies);
  };

  const handleEditClick = (movie) => {
    setMovieToEdit({
      imdbID: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      type: movie.Type.toLowerCase(),
      poster: movie.Poster,
      plot: movie.Plot || ''
    });
    setShowEditMovieModal(true);
  };

  const handleUpdateMovie = async () => {
    if (!movieToEdit || !movieToEdit.title || !movieToEdit.poster) {
      return alert("Title and Poster are required.");
    }
    try {
      const res = await fetch(`http://localhost:5000/api/movies/${movieToEdit.imdbID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movieToEdit)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowEditMovieModal(false);
        
        const query = movieSearchQuery.trim().toLowerCase();
        
        // Update the movie in the list for immediate UI feedback
        const updateMovieInState = (movieList, filterBySearch, isTrendingList) => {
          let updated = [...movieList];
          const index = updated.findIndex(m => m.imdbID === movieToEdit.imdbID);
          const updatedMovie = { imdbID: movieToEdit.imdbID, Title: movieToEdit.title, Year: movieToEdit.year, Type: movieToEdit.type, Poster: movieToEdit.poster, Plot: movieToEdit.plot };
          
          if (index !== -1) {
            updated[index] = { ...updated[index], ...updatedMovie };
          } else if (isTrendingList && movieToEdit.type === 'avengers') {
            updated.unshift(updatedMovie);
          }

          if (filterBySearch && query) {
            updated = updated.filter(m => m.Title.toLowerCase().includes(query) || m.Type.toLowerCase() === query);
          }
          if (isTrendingList) {
            updated = updated.filter(m => m.Type.toLowerCase() === 'avengers');
          }
          return updated;
        };

        setAdminMovies(updateMovieInState(adminMovies, true, false));
        setDefaultAdminMovies(updateMovieInState(defaultAdminMovies, false, false));
        setTrendingMovies(updateMovieInState(trendingMovies, false, true));
        setDefaultTrendingMovies(updateMovieInState(defaultTrendingMovies, false, true));
        setMovieToEdit(null);
      } else {
        alert("Failed to update movie.");
      }
    } catch (err) {
      console.error("Error updating movie:", err);
      alert("Server error.");
    }
  };

  const handleEditPlanClick = (plan) => {
    setPlanToEdit({ ...plan });
    setShowEditPlanModal(true);
  };

  const handleUpdatePlan = async () => {
    try {
      // Format numbers correctly to prevent backend type errors
      const payload = {
        ...planToEdit,
        price: planToEdit.price === '' ? 0 : Number(planToEdit.price),
        duration_months: planToEdit.duration_months === '' ? 0 : Number(planToEdit.duration_months),
        screens: planToEdit.screens === '' ? 1 : Number(planToEdit.screens)
      };

      const res = await fetch(`http://localhost:5000/api/plans/${planToEdit.plan_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowEditPlanModal(false);
        setPlans(plans.map(p => p.plan_id === planToEdit.plan_id ? payload : p));
        setPlanToEdit(null);
      } else {
        alert(data.message || "Failed to update plan.");
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      alert("Server error.");
    }
  };

  const handleDeleteMovieClick = (movie) => {
    setMovieToDelete(movie);
    setShowDeleteMovieConfirm(true);
  };

  const confirmDeleteMovie = async () => {
    if (!movieToDelete) return;
    try {
      const response = await fetch(`http://localhost:5000/api/movies/${movieToDelete.imdbID}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setAdminMovies(adminMovies.filter(m => m.imdbID !== movieToDelete.imdbID));
        setDefaultAdminMovies(defaultAdminMovies.filter(m => m.imdbID !== movieToDelete.imdbID));
        setTrendingMovies(trendingMovies.filter(m => m.imdbID !== movieToDelete.imdbID));
        setDefaultTrendingMovies(defaultTrendingMovies.filter(m => m.imdbID !== movieToDelete.imdbID));
        setShowDeleteMovieConfirm(false);
        setMovieToDelete(null);
      } else {
        alert("Failed to delete movie.");
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
      alert("Server error.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`http://localhost:5000/delete-account/${userToDelete.id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        setShowDeleteConfirm(false);
        setUserToDelete(null);
      } else {
        alert("Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Server error.");
    }
  };

  const handleToggleBlock = async (user) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}/toggle-block`, {
        method: "PUT"
      });
      const data = await response.json();
      if (data.success) {
        setUsers(users.map(u => {
          if (u.id === user.id) {
            return { ...u, is_blocked: !u.is_blocked };
          }
          return u;
        }));
      } else {
        alert("Failed to update user status.");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Server error.");
    }
  };

  const handleAddMovie = async () => {
    if (!newMovie.title || !newMovie.poster) return alert("Title and Poster are required.");
    try {
      const res = await fetch("http://localhost:5000/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMovie)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowAddMovieModal(false);

        // ✅ Instantly reflect the added movie in the UI list
        const addedMovie = {
          imdbID: data.imdbID,
          Title: newMovie.title,
          Year: newMovie.year,
          Type: newMovie.type,
          Poster: newMovie.poster,
          Plot: newMovie.plot
        };
        setAdminMovies([addedMovie, ...adminMovies]);
        setDefaultAdminMovies([addedMovie, ...defaultAdminMovies]);
        if (newMovie.type === 'avengers') {
          setTrendingMovies([addedMovie, ...trendingMovies]);
          setDefaultTrendingMovies([addedMovie, ...defaultTrendingMovies]);
        }

        setNewMovie({ title: '', year: '', type: 'movie', poster: '', plot: '' });
      } else {
        alert("Failed to add movie.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sidebarStyle = {
    width: "250px",
    background: "#181818",
    height: "calc(100vh - 100px)",
    position: "sticky",
    top: "100px",
    padding: "20px",
    boxSizing: "border-box",
    borderRight: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto"
  };

  const contentStyle = {
    flex: 1,
    padding: "30px",
    color: "white"
  };

  const menuItemStyle = (tab) => ({
    padding: "15px 20px",
    margin: "5px 0",
    cursor: "pointer",
    borderRadius: "8px",
    background: activeTab === tab ? "#e50914" : "transparent",
    color: activeTab === tab ? "white" : "#ccc",
    fontWeight: activeTab === tab ? "bold" : "normal",
    transition: "background 0.2s"
  });

  return (
    <>
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#111" }}>
        {/* Sidebar */}
        <div style={sidebarStyle}>
          <h2 style={{ color: "white", marginBottom: "30px", textAlign: "center" }}>HI ADMIN!</h2>
          
          <div style={menuItemStyle("statistics")} onClick={() => setActiveTab("statistics")}>📊 Statistics</div>
          <div style={menuItemStyle("users")} onClick={() => setActiveTab("users")}>👥 Users</div>
          <div style={menuItemStyle("movies")} onClick={() => setActiveTab("movies")}>🎬 Movies</div>
          <div style={menuItemStyle("trending")} onClick={() => setActiveTab("trending")}>🔥 Trending Movies</div>
          <div style={menuItemStyle("subscriptions")} onClick={() => setActiveTab("subscriptions")}>💳 Subscription Plans</div>
          <div style={menuItemStyle("settings")} onClick={() => setActiveTab("settings")}>⚙️ Settings</div>

          <div style={{ marginTop: "auto" }}>
            {/* <button 
              onClick={() => setShowLogoutConfirm(true)} 
              style={{ width: "100%", padding: "12px", background: "#2a2a2a", color: "red", border: "1px solid #444", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              🚪 Logout
            </button> */}
          </div>
        </div>

        {/* Main Content */}
        <div style={contentStyle}>
          {activeTab === "statistics" && (
            <div>
              <h1>📊 Dashboard Statistics</h1>
              {loadingStats || !stats ? <p>Loading statistics...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Top Cards */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={statCardStyle}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#ccc' }}>Total Users</h3>
                      <p style={statValueStyle}>{stats.users.totalUsers || 0}</p>
                    </div>
                    <div style={statCardStyle}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#ccc' }}>Active Users</h3>
                      <p style={statValueStyle}>{stats.users.activeUsers || 0}</p>
                    </div>
                    <div style={statCardStyle}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#ccc' }}>New Users (30d)</h3>
                      <p style={statValueStyle}>{stats.users.newUsers || 0}</p>
                    </div>
                    <div style={statCardStyle}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#ccc' }}>Total Local Movies</h3>
                      <p style={statValueStyle}>{stats.movies.reduce((sum, m) => sum + m.count, 0)}</p>
                    </div>
                  </div>

                  {/* Grid for Tables/Charts */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    
                    {/* Subscription Plans */}
                    <div style={statSectionStyle}>
                      <h3 style={{ marginTop: 0 }}>💳 Revenue by Plan</h3>
                      {stats.subscriptions.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={stats.subscriptions}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                            <XAxis dataKey="plan_name" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444', borderRadius: '8px' }} />
                            <Bar dataKey="total_revenue" fill="#28a745" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="total_subscriptions" fill="#007bff" name="Subscribers" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <p style={{ color: '#aaa' }}>No subscriptions yet.</p>}
                    </div>

                    {/* Top Watched Movies */}
                    <div style={statSectionStyle}>
                      <h3 style={{ marginTop: 0 }}>🔥 Top 5 Watched Movies</h3>
                      {stats.topMovies.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={stats.topMovies} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" horizontal={false} />
                            <XAxis type="number" stroke="#ccc" />
                            <YAxis dataKey="title" type="category" stroke="#ccc" width={80} tick={{fontSize: 12}} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444', borderRadius: '8px' }} />
                            <Bar dataKey="views" fill="#e50914" name="Views" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <p style={{ color: '#aaa' }}>No watch history yet.</p>}
                    </div>

                    {/* Movies by Genre */}
                    <div style={statSectionStyle}>
                      <h3 style={{ marginTop: 0 }}>🎬 Local Movies by Genre</h3>
                      {stats.movies.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie data={stats.movies} dataKey="count" nameKey="genre" cx="50%" cy="50%" outerRadius={80} label>
                              {stats.movies.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : <p style={{ color: '#aaa' }}>No local movies added.</p>}
                    </div>

                    {/* User Growth */}
                    <div style={statSectionStyle}>
                      <h3 style={{ marginTop: 0 }}>📈 Monthly User Growth</h3>
                      {stats.userGrowth.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={stats.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="month" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="new_users" stroke="#e50914" strokeWidth={3} name="New Users" dot={{ r: 5 }} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : <p style={{ color: '#aaa' }}>No growth data.</p>}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "users" && (
            <div>
              <h1>👥 User Management</h1>
              {loadingUsers ? <p>Loading users...</p> :
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                    <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>ID</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Name</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Email</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Role</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Plan</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Join Date</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Expiry Date</th>
                    <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Status</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center', color: '#ccc' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                      <td style={{ padding: '12px 10px' }}>{user.id}</td>
                      <td style={{ padding: '12px 10px' }}>{user.name}</td>
                      <td style={{ padding: '12px 10px' }}>{user.email}</td>
                      <td style={{ padding: '12px 10px' }}>{user.role}</td>
                      <td style={{ padding: '12px 10px' }}>{user.subscription_plan || 'Free'}</td>
                      <td style={{ padding: '12px 10px' }}>{user.join_date ? new Date(user.join_date).toLocaleDateString() : (user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A')}</td>
                      <td style={{ padding: '12px 10px' }}>{user.expiry_date ? new Date(user.expiry_date).toLocaleDateString() : 'N/A'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: user.is_blocked ? '#e50914' : '#28a745', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button style={{ ...actionBtnStyle, backgroundColor: '#e50914' }} onClick={() => handleDeleteClick(user)}>Delete</button>
                        <button style={{ ...actionBtnStyle, backgroundColor: user.is_blocked ? '#28a745' : '#ffc107', color: user.is_blocked ? 'white' : 'black' }} onClick={() => handleToggleBlock(user)}>
                          {user.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          )}
          {activeTab === "movies" && (
            <div>
              <h1>🎬 Movie Management</h1>
              
              {/* 🔍 Search Bar & Actions */}
              <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Search movies by title..."
                    value={movieSearchQuery}
                    onChange={(e) => setMovieSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMovies()}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#222", color: "#fff", width: "300px", outline: "none" }}
                  />
                  {/* <button onClick={handleSearchMovies} style={{ ...btnStyle, margin: 0 }}>Search</button> */}
                </div>
                <button onClick={() => setShowAddMovieModal(true)} style={{ ...btnStyle, margin: 0, backgroundColor: "#28a745" }}>➕ Add Movie</button>
              </div>

              {/* 🎬 Movie Table */}
              {loadingAdminMovies ? <p>Loading movies...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Poster</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Title</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Year</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Type</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', color: '#ccc' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminMovies && adminMovies.length > 0 ? adminMovies.map(movie => (
                      <tr key={movie.imdbID} style={{ borderBottom: '1px solid #2a2a2a' }}>
                        <td style={{ padding: '12px 10px' }}><img src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/50x75?text=No+Image"} alt={movie.Title} style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} /></td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{movie.Title}</td>
                        <td style={{ padding: '12px 10px' }}>{movie.Year}</td>
                        <td style={{ padding: '12px 10px', textTransform: 'capitalize' }}>{movie.Type}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <button style={{ ...actionBtnStyle, backgroundColor: '#007bff' }} onClick={() => handleEditClick(movie)}>Edit</button>
                          <button style={{ ...actionBtnStyle, backgroundColor: '#e50914' }} onClick={() => handleDeleteMovieClick(movie)}>Delete</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ padding: '12px 10px', textAlign: 'center', color: '#aaa' }}>No movies found. Try a different search.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {activeTab === "trending" && (
            <div>
              <h1>🔥 Trending Movies</h1>
              
              <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search trending movies by title..."
                  value={trendingSearchQuery}
                  onChange={(e) => setTrendingSearchQuery(e.target.value)}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #333", background: "#222", color: "#fff", width: "300px", outline: "none" }}
                />
              </div>

              {loadingTrending ? <p>Loading trending movies...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Poster</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Title</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Year</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left', color: '#ccc' }}>Type</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center', color: '#ccc' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendingMovies && trendingMovies.length > 0 ? trendingMovies.map(movie => (
                      <tr key={movie.imdbID} style={{ borderBottom: '1px solid #2a2a2a' }}>
                        <td style={{ padding: '12px 10px' }}><img src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/50x75?text=No+Image"} alt={movie.Title} style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} /></td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{movie.Title}</td>
                        <td style={{ padding: '12px 10px' }}>{movie.Year}</td>
                        <td style={{ padding: '12px 10px', textTransform: 'capitalize' }}>{movie.Type}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          <button style={{ ...actionBtnStyle, backgroundColor: '#007bff' }} onClick={() => handleEditClick(movie)}>Edit</button>
                          <button style={{ ...actionBtnStyle, backgroundColor: '#e50914' }} onClick={() => handleDeleteMovieClick(movie)}>Delete</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ padding: '12px 10px', textAlign: 'center', color: '#aaa' }}>No trending movies found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {activeTab === "subscriptions" && (
            <div>
              <h1>💳 Subscription Plans</h1>
              {loadingPlans ? <p>Loading plans...</p> : (
                <div className="plans-wrapper" style={{ marginTop: '20px' }}>
                  {plans && plans.length > 0 ? plans.map(plan => (
                    <div key={plan.plan_id} className={`plan-card ${plan.plan_name === 'Standard' ? 'popular' : ''}`}>
                      <h2>{plan.plan_name}</h2>
                      <p className="price">${plan.price} <span style={{ fontSize: '1rem', color: '#aaa', fontWeight: 'normal' }}>/ {plan.duration_months} months</span></p>
                      <div className="plan-features">
                        <div className="feature-item">
                            <span className="feature-label">Video Quality</span>
                            <span className="feature-value quality">{plan.video_quality || 'Good'}</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-label">Resolution</span>
                            <span className="feature-value">{plan.resolution || '480p'}</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-label">Supported Devices</span>
                            <span className="feature-value">{plan.supported_devices || 'Mobile, Tablet'}</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-label">Ads</span>
                            <span className="feature-value">{plan.is_ads_free ? 'Ad-free' : 'With Ads'}</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-label">Screens</span>
                            <span className="feature-value">{plan.screens || 1}</span>
                        </div>
                      </div>
                      <button onClick={() => handleEditPlanClick(plan)}>
                        Edit Plan
                      </button>
                    </div>
                  )) : (
                    <p style={{ color: '#aaa' }}>No plans found.</p>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === "settings" && <div><h1>⚙️ Settings</h1><p>Configure global application settings.</p></div>}
        </div>
      </div>

      {/* 🚪 SIGN OUT CONFIRM MODAL */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", maxWidth: "350px", position: "relative" }}>
            <p style={{ fontSize: "1.2rem", color: "#fff", margin: "0 0 20px 0", fontWeight: "500" }}>
              Are you sure you want to log out?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <button 
                onClick={handleLogout}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px", background: "#e50914", color: "#fff", border: "none", cursor: "pointer", fontWeight: "600" }}
              >
                Yes
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", cursor: "pointer", fontWeight: "500" }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ DELETE USER CONFIRM MODAL */}
      {showDeleteConfirm && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", maxWidth: "350px", position: "relative" }}>
            <p style={{ fontSize: "1.2rem", color: "#fff", margin: "0 0 20px 0", fontWeight: "500" }}>
              Are you sure you want to delete user "{userToDelete.name}"?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <button 
                onClick={confirmDeleteUser}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px", background: "#e50914", color: "#fff", border: "none", cursor: "pointer", fontWeight: "600" }}
              >
                Yes
              </button>
              <button 
                onClick={() => { setShowDeleteConfirm(false); setUserToDelete(null); }}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", cursor: "pointer", fontWeight: "500" }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ➕ ADD MOVIE MODAL */}
      {showAddMovieModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", maxWidth: "400px", position: "relative", margin: "auto" }}>
            <h2 style={{ marginTop: 0, color: "#fff", borderBottom: "1px solid #333", paddingBottom: "10px" }}>Add Custom Movie</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <input type="text" placeholder="Movie Title" value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="Release Year (e.g., 2024)" value={newMovie.year} onChange={e => setNewMovie({...newMovie, year: e.target.value})} style={inputStyle} />
              <select value={newMovie.type} onChange={e => setNewMovie({...newMovie, type: e.target.value})} style={inputStyle}>
                <option value="movie">General Movie</option>
                <option value="avengers">Trending Movies</option>
                <option value="comedy">Comedy Movies</option>
                <option value="minions">Kids Cartoon</option>
                <option value="animation">Animated Movies</option>
                <option value="fast">Action Movies</option>
                <option value="horror">Horror Movies</option>
                <option value="alien">Sci-Fi Movies</option>
                <option value="thriller">Thriller Movies</option>
                <option value="disney">Disney Movies</option>
                <option value="series">Web Series</option>
              </select>
              <input type="text" placeholder="Poster Image URL" value={newMovie.poster} onChange={e => setNewMovie({...newMovie, poster: e.target.value})} style={inputStyle} />
              <textarea placeholder="Plot summary..." value={newMovie.plot} onChange={e => setNewMovie({...newMovie, plot: e.target.value})} style={{...inputStyle, height: '80px', resize: 'none'}} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" }}>
              <button onClick={() => setShowAddMovieModal(false)} style={{ padding: "10px 15px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddMovie} style={{ padding: "10px 15px", background: "#e50914", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Save Movie</button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ EDIT MOVIE MODAL */}
      {showEditMovieModal && movieToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", maxWidth: "400px", position: "relative", margin: "auto" }}>
            <h2 style={{ marginTop: 0, color: "#fff", borderBottom: "1px solid #333", paddingBottom: "10px" }}>Edit Movie</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <input type="text" placeholder="Movie Title" value={movieToEdit.title} onChange={e => setMovieToEdit({ ...movieToEdit, title: e.target.value })} style={inputStyle} />
              <input type="text" placeholder="Release Year" value={movieToEdit.year} onChange={e => setMovieToEdit({ ...movieToEdit, year: e.target.value })} style={inputStyle} />
              <select value={movieToEdit.type} onChange={e => setMovieToEdit({ ...movieToEdit, type: e.target.value })} style={inputStyle}>
                <option value="movie">General Movie</option>
                <option value="avengers">Trending Movies</option>
                <option value="comedy">Comedy Movies</option>
                <option value="minions">Kids Cartoon</option>
                <option value="animation">Animated Movies</option>
                <option value="fast">Action Movies</option>
                <option value="horror">Horror Movies</option>
                <option value="alien">Sci-Fi Movies</option>
                <option value="thriller">Thriller Movies</option>
                <option value="disney">Disney Movies</option>
                <option value="series">Web Series</option>
              </select>
              <input type="text" placeholder="Poster Image URL" value={movieToEdit.poster} onChange={e => setMovieToEdit({ ...movieToEdit, poster: e.target.value })} style={inputStyle} />
              <textarea placeholder="Plot summary..." value={movieToEdit.plot} onChange={e => setMovieToEdit({ ...movieToEdit, plot: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'none' }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" }}>
              <button onClick={() => setShowEditMovieModal(false)} style={{ padding: "10px 15px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUpdateMovie} style={{ padding: "10px 15px", background: "#e50914", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ DELETE MOVIE CONFIRM MODAL */}
      {showDeleteMovieConfirm && movieToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", textAlign: "center", maxWidth: "350px", position: "relative" }}>
            <p style={{ fontSize: "1.2rem", color: "#fff", margin: "0 0 20px 0", fontWeight: "500" }}>
              Are you sure you want to delete "{movieToDelete.Title}"?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <button 
                onClick={confirmDeleteMovie}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px", background: "#e50914", color: "#fff", border: "none", cursor: "pointer", fontWeight: "600" }}
              >
                Yes
              </button>
              <button 
                onClick={() => { setShowDeleteMovieConfirm(false); setMovieToDelete(null); }}
                style={{ width: "100px", fontSize: "1rem", padding: "8px 0", borderRadius: "6px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", cursor: "pointer", fontWeight: "500" }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ EDIT PLAN MODAL */}
      {showEditPlanModal && planToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#181818", padding: "25px", borderRadius: "8px", border: "1px solid #333", maxWidth: "400px", position: "relative", margin: "auto" }}>
            <h2 style={{ marginTop: 0, color: "#fff", borderBottom: "1px solid #333", paddingBottom: "10px" }}>Edit Plan</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <input type="text" placeholder="Plan Name" value={planToEdit.plan_name} onChange={e => setPlanToEdit({ ...planToEdit, plan_name: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Price ($)" value={planToEdit.price} onChange={e => setPlanToEdit({ ...planToEdit, price: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Duration (Months)" value={planToEdit.duration_months} onChange={e => setPlanToEdit({ ...planToEdit, duration_months: e.target.value })} style={inputStyle} />
              <input type="text" placeholder="Video Quality (e.g., Good)" value={planToEdit.video_quality || ''} onChange={e => setPlanToEdit({ ...planToEdit, video_quality: e.target.value })} style={inputStyle} />
              <input type="text" placeholder="Resolution (e.g., 480p)" value={planToEdit.resolution || ''} onChange={e => setPlanToEdit({ ...planToEdit, resolution: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Screens" value={planToEdit.screens || ''} onChange={e => setPlanToEdit({ ...planToEdit, screens: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" }}>
              <button onClick={() => setShowEditPlanModal(false)} style={{ padding: "10px 15px", background: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleUpdatePlan} style={{ padding: "10px 15px", background: "#e50914", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const btnStyle = { padding: "10px 15px", margin: "10px 10px 10px 0", background: "#e50914", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.95rem" };
const actionBtnStyle = { padding: "6px 10px", margin: "0 4px", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" };
const inputStyle = { padding: "12px", borderRadius: "6px", border: "1px solid #333", background: "#222", color: "#fff", width: "100%", boxSizing: "border-box", outline: "none", fontSize: "1rem" };
const statCardStyle = { background: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #333', flex: '1', minWidth: '200px', textAlign: 'center' };
const statValueStyle = { fontSize: '2.5rem', fontWeight: 'bold', color: '#e50914', margin: '10px 0 0 0' };
const statSectionStyle = { background: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #333', flex: '1', minWidth: '300px' };
const statTableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '10px' };
const thStyle = { padding: '10px', textAlign: 'left', borderBottom: '1px solid #444', color: '#ccc' };
const tdStyle = { padding: '10px', borderBottom: '1px solid #2a2a2a', color: '#fff' };

export default AdminDashboard;