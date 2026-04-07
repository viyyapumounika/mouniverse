import React, { useState, useEffect } from "react";
import SplashScreen from "./components/SplashScreen";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import MovieRow from "./components/MovieRow";
import MovieSlider from "./components/MovieSlider";
import { useNavigate, useLocation } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Watchlist from "./components/Watchlist";
import History from "./components/History";
import Settings from "./components/Settings";
import DeleteAccount from "./components/DeleteAccount";
import AdminDashboard from "./components/AdminDashboard";
import SubscriptionPlan from "./components/SubscriptionPlan";
import PaymentForm from "./components/PaymentForm";
import Register from "./components/Register";

function App() {
  const [screen, setScreen] = useState("splash");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Keep login after refresh
  useEffect(() => {
    const login = localStorage.getItem("login");
    if (login === "true") {
      const storedUser = JSON.parse(localStorage.getItem("user")) || {};
      setUser(storedUser);
      setIsLoggedIn(true);

      // If a logged-in user lands on a public auth page, redirect them to home.
      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate('/');
      }
    }
  }, []);

  // 🎬 ALL CATEGORIES
  const categories = [
    { title: "Trending Movies", query: "Avengers" },
    { title: "Comedy Movies", query: "Comedy" },
    { title: "Kids Cartoon", query: "Minions" },
    { title: "Animated Movies", query: "Animation" },
    { title: "Action Movies", query: "Fast" },
    { title: "Horror Movies", query: "Horror" },
    { title: "Sci-Fi Movies", query: "Alien" },
    { title: "Thriller Movies", query: "Thriller" },
    { title: "Disney Movies", query: "Disney" },
    { title: "Web Series", query: "Series" },
  ];
  

  // 🔍 FILTER CATEGORIES
  const displayedCategories = search
    ? categories.filter((cat) =>
        cat.title.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  // 🎬 SPLASH SCREEN
  if (screen === "splash") {
    return <SplashScreen onFinish={() => setScreen("home")} />;
  }

  const showNavbar = isLoggedIn && location.pathname !== '/subscription' && location.pathname !== '/payment';

   // ✅ MAIN APP WITH ROUTING
  return (
    <>
      {showNavbar && <Navbar search={search} setSearch={setSearch} />}

      {/* Adjust margin top only when navbar is visible */}
      <div style={{ marginTop: showNavbar ? "100px" : "0" }}>
        <Routes>
          {!isLoggedIn ? (
            <>
              <Route path="/login" element={
                <Login
                  onLoginSuccess={(userData) => {
                    // Set state to trigger re-render
                    setUser(userData);
                    setIsLoggedIn(true);

                    // Handle navigation after state is set
                    if (userData.role === 'admin') {
                        navigate('/admin');
                    } else if (userData.subscription && userData.subscription.plan_id) {
                        navigate('/');
                    } else {
                        navigate('/subscription');
                    }
                  }}
                />
              } />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route
                path="/"
                element={
                  user && user.role === "admin" ? (
                    <Navigate to="/admin" />
                  ) : (
                    <>
                      {!search && <MovieSlider />}
                      {search ? (
                        <MovieRow
                          title={`Search Results for "${search}"`}
                          search={search}
                        />
                      ) : (
                        displayedCategories.map((cat) => (
                          <MovieRow
                            key={cat.title}
                            title={cat.title}
                            search={cat.query}
                          />
                        ))
                      )}
                    </>
                  )
                }
              />
              <Route
                path="/admin"
                element={
                  user && user.role === "admin" ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/delete-account" element={<DeleteAccount />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/subscription" element={<SubscriptionPlan />} />
              <Route path="/payment" element={<PaymentForm />} />
              {/* Redirect any other paths tSerieso home when logged in */}
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </div>
    </>
  );
}

export default App;