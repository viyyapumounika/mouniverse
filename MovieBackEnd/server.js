const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 DB CONNECTION
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // It's better to use environment variables for credentials
  password: "root",
  database: "movieapp",
});

db.connect((err) => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("MySQL Connected ✅");
    db.query("CREATE TABLE IF NOT EXISTS hidden_movies (imdbID VARCHAR(50) PRIMARY KEY)");
  }
});

// 📝 REGISTER
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const saltRounds = 10;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.log("Hashing Error:", err);
      return res.json({ success: false, message: "Server error during registration." });
    }

    // Set default role to 'user' on registration
    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')";

    db.query(sql, [name, email, hash], (dbErr) => {
      if (dbErr) {
        console.log("DB Error on Register:", dbErr);
        return res.json({ success: false, message: "Database error during registration." });
      }
      res.json({ success: true });
    });
  });
});

// 🔐 LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const user = results[0];

    if (user.is_blocked) {
      return res.status(403).json({ msg: "Your account has been blocked by the admin." });
    }

    // Compare plaintext password with hashed password from DB
    bcrypt.compare(password, user.password, (compareErr, isMatch) => {
      if (compareErr || !isMatch) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      // ✅ Send all user data needed by frontend (except password)
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    });
  });
});

// 💹 GET PLANS
app.get("/api/plans", (req, res) => {
  const sql = "SELECT * FROM subscription_plans ORDER BY price";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error fetching plans." });
    }
    res.json(results);
  });
});

// ✏️ UPDATE PLAN
app.put("/api/plans/:plan_id", (req, res) => {
  const { plan_id } = req.params;
  let { plan_name, price, duration_months, video_quality, resolution, screens } = req.body;

  // Convert empty strings to default numbers to prevent MySQL strict mode errors
  price = price !== '' && price !== undefined ? Number(price) : 0;
  duration_months = duration_months !== '' && duration_months !== undefined ? Number(duration_months) : 0;
  screens = screens !== '' && screens !== undefined ? Number(screens) : 1;

  const sql = "UPDATE subscription_plans SET plan_name=?, price=?, duration_months=?, video_quality=?, resolution=?, screens=? WHERE plan_id=?";
  db.query(sql, [plan_name, price, duration_months, video_quality, resolution, screens, plan_id], (err, result) => {
    if (err) {
      console.error("Error updating plan:", err);
      return res.status(500).json({ success: false, message: `Database error: ${err.message}` });
    }
    res.json({ success: true, message: "Plan updated successfully!" });
  });
});

// 📊 GET DASHBOARD STATISTICS
app.get("/api/statistics", (req, res) => {
  const stats = {
    users: { totalUsers: 0, activeUsers: 0, newUsers: 0 },
    subscriptions: [],
    movies: [],
    topMovies: [],
    userGrowth: []
  };

  const queries = [
    new Promise((resolve) => {
      db.query("SELECT COUNT(*) as totalUsers, IFNULL(SUM(CASE WHEN is_blocked = 0 THEN 1 ELSE 0 END), 0) as activeUsers, IFNULL(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as newUsers FROM users", (err, results) => {
        if (!err && results.length) stats.users = results[0];
        else if (err) console.error("Stats users error:", err);
        resolve();
      });
    }),
    new Promise((resolve) => {
      db.query("SELECT sp.plan_name, COUNT(p.payment_id) as total_subscriptions, IFNULL(SUM(p.amount), 0) as total_revenue FROM payments p JOIN subscription_plans sp ON p.plan_id = sp.plan_id GROUP BY sp.plan_name", (err, results) => {
        if (!err) stats.subscriptions = results;
        else console.error("Stats subscriptions error:", err);
        resolve();
      });
    }),
    new Promise((resolve) => {
      db.query("SELECT type as genre, COUNT(*) as count FROM movies GROUP BY type", (err, results) => {
        if (!err) stats.movies = results;
        else console.error("Stats movies error:", err);
        resolve();
      });
    }),
    new Promise((resolve) => {
      db.query("SELECT title, COUNT(*) as views FROM history GROUP BY title ORDER BY views DESC LIMIT 5", (err, results) => {
        if (!err) stats.topMovies = results;
        else console.error("Stats history error:", err);
        resolve();
      });
    }),
    new Promise((resolve) => {
      db.query("SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as new_users FROM users WHERE created_at IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 6", (err, results) => {
        if (!err) stats.userGrowth = results.reverse();
        else console.error("Stats growth error:", err);
        resolve();
      });
    })
  ];

  Promise.all(queries).then(() => res.json({ success: true, stats }));
});

// 💹 GET ALL USERS (for Admin Dashboard)
app.get("/api/users", (req, res) => {
  const sql = `
    SELECT 
      u.*, 
      u.created_at AS join_date,
      (SELECT sp.plan_name FROM payments p JOIN subscription_plans sp ON p.plan_id = sp.plan_id WHERE p.user_id = u.id ORDER BY p.payment_id DESC LIMIT 1) AS subscription_plan,
      (SELECT p.expiry_date FROM payments p WHERE p.user_id = u.id ORDER BY p.payment_id DESC LIMIT 1) AS expiry_date
    FROM users u
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ success: false, message: "Database error fetching users." });
    }
    res.json(results);
  });
});

// 🚫 TOGGLE USER BLOCK STATUS
app.put("/api/users/:id/toggle-block", (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE users SET is_blocked = NOT is_blocked WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error toggling block status:", err);
      return res.status(500).json({ success: false, message: "Database error." });
    }
    res.json({ success: true });
  });
});

// 🎬 GET CUSTOM MOVIES
app.get("/api/movies", (req, res) => {
  const sql = "SELECT * FROM movies";
  db.query(sql, (err, results) => {
    if (err) return res.json([]);
    const formatted = results.map(m => ({
      Title: m.title,
      Year: m.year,
      Type: m.type,
      Poster: m.poster,
      imdbID: m.imdbID || m.imdbid, // Fallback for MySQL lowercase column names
      Plot: m.plot,
      imdbRating: "N/A"
    }));
    res.json(formatted);
  });
});

// ➕ ADD CUSTOM MOVIE
app.post("/api/movies", (req, res) => {
  const { title, year, type, poster, plot } = req.body;
  const imdbID = 'custom_' + Date.now(); // Generate a unique local ID
  const sql = "INSERT INTO movies (imdbID, title, year, type, poster, plot) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [imdbID, title, year, type, poster, plot], (err, result) => {
    if (err) {
      console.error("Error adding movie:", err);
      return res.json({ success: false, message: "Database error." });
    }
    res.json({ success: true, message: "Movie added successfully!", imdbID });
  });
});

// ✏️ UPDATE/EDIT MOVIE
app.put("/api/movies/:imdbID", (req, res) => {
  const { imdbID } = req.params;
  const { title, year, type, poster, plot } = req.body;

  if (!imdbID || imdbID === "undefined") {
    return res.json({ success: false, message: "Invalid Movie ID." });
  }

  // First explicitly check if the movie exists to avoid false-positive INSERTS
  db.query("SELECT * FROM movies WHERE imdbID = ?", [imdbID], (err, results) => {
    if (err) return res.json({ success: false, message: "Database error during check." });

    if (results.length > 0) {
      // Movie exists, strictly UPDATE it
      const updateSql = "UPDATE movies SET title=?, year=?, type=?, poster=?, plot=? WHERE imdbID=?";
      db.query(updateSql, [title, year, type, poster, plot, imdbID], (updateErr) => {
        if (updateErr) return res.json({ success: false, message: "Database error during update." });
        res.json({ success: true, message: "Movie updated successfully!" });
      });
    } else {
      // Movie doesn't exist, INSERT it (for new OMDB customizations)
      const insertSql = "INSERT INTO movies (imdbID, title, year, type, poster, plot) VALUES (?, ?, ?, ?, ?, ?)";
      db.query(insertSql, [imdbID, title, year, type, poster, plot], (insertErr) => {
        if (insertErr) return res.json({ success: false, message: "Database error during insert." });
        res.json({ success: true, message: "Movie updated successfully!" });
      });
    }
  });
});

// 🗑️ DELETE CUSTOM MOVIE
app.delete("/api/movies/:imdbID", (req, res) => {
  const { imdbID } = req.params;
  db.query("INSERT IGNORE INTO hidden_movies (imdbID) VALUES (?)", [imdbID], (err) => {
    if (err) return res.json({ success: false, message: "Database error." });
    db.query("DELETE FROM movies WHERE imdbID = ?", [imdbID], (deleteErr) => {
      if (deleteErr) return res.json({ success: false, message: "Database error." });
      res.json({ success: true, message: "Movie deleted successfully!" });
    });
  });
});

// 🚫 GET HIDDEN MOVIES
app.get("/api/hidden-movies", (req, res) => {
  db.query("SELECT imdbID FROM hidden_movies", (err, results) => {
    if (err) return res.json([]);
    res.json(results.map(row => row.imdbID));
  });
});

// ✅ CHECK SUBSCRIPTION
app.get("/check-subscription/:user_id", (req, res) => {
  const { user_id } = req.params;
  const today = new Date().toISOString().slice(0, 10);

  // Check for a successful payment where the expiry date is in the future (or null for lifetime plans)
  const sql = "SELECT * FROM payments WHERE user_id = ? AND payment_status = 'SUCCESS' AND (expiry_date IS NULL OR expiry_date >= ?) ORDER BY payment_date DESC LIMIT 1";

  db.query(sql, [user_id, today], (err, results) => {
    if (err) {
      return res.status(500).json({ hasSubscription: false, error: "Database error" });
    }
    if (results.length > 0) {
      // User has an active subscription
      res.json({ hasSubscription: true, subscription: results[0] });
    } else {
      // No active subscription found
      res.json({ hasSubscription: false });
    }
  });
});

// 💳 SUBSCRIBE
app.post("/subscribe", (req, res) => {
  const { user_id, plan_id, name, email, upi_id } = req.body;

  // 1. Get plan details from DB
  const getPlanSql = "SELECT * FROM subscription_plans WHERE plan_id = ?";
  db.query(getPlanSql, [plan_id], (err, plans) => {
    if (err || plans.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found." });
    }

    const plan = plans[0];
    const { duration_months, price } = plan;

    // 2. Calculate expiry date
    let expiry_date = null;
    if (duration_months > 0) {
      const now = new Date();
      expiry_date = new Date(now.setMonth(now.getMonth() + duration_months));
    }

    // 3. Insert into payments table
    const insertPaymentSql = "INSERT INTO payments (user_id, plan_id, name, email, upi_id, amount, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(insertPaymentSql, [user_id, plan_id, name, email, upi_id, price, expiry_date], (paymentErr, result) => {
      if (paymentErr) {
        console.error("Payment insert error:", paymentErr);
        return res.status(500).json({ success: false, message: "Failed to record payment." });
      }
      // After successful insert, fetch the new record to return it
      const newPaymentId = result.insertId;
      db.query("SELECT * FROM payments WHERE payment_id = ?", [newPaymentId], (selectErr, newPayment) => {
        if (selectErr || newPayment.length === 0) {
          return res.json({ success: true, message: "Subscription activated successfully!" });
        }
        res.json({ success: true, message: "Subscription activated successfully!", subscription: newPayment[0] });
      });
    });
  });
});

// ⭐ ADD TO WATCHLIST
app.post("/add-to-watchlist", (req, res) => {
  console.log("API HIT ✅");
  console.log("BODY:", req.body);

  // Safely grab both local formats and OMDB API formats
  const user_id = req.body.user_id;
  const movie_id = req.body.movie_id || req.body.imdbID;
  const title = req.body.title || req.body.Title;
  const poster = req.body.poster || req.body.Poster;

  const sql = "INSERT INTO watchlist (user_id, movie_id, title, poster) VALUES (?, ?, ?, ?)";

  db.query(sql, [user_id, movie_id, title, poster], (err, result) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.json({ success: false });
    }
    res.json({ success: true });
  });
});

// 📺 GET WATCHLIST
app.get("/watchlist/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const sql = "SELECT * FROM watchlist WHERE user_id=?";

  db.query(sql, [user_id], (err, result) => {
    if (err) return res.json([]);

    res.json(result);
  });
});

// ❌ REMOVE WATCHLIST
app.delete("/remove-watchlist", (req, res) => {
  const { id, user_id } = req.body;

  const sql = "DELETE FROM watchlist WHERE id=? AND user_id=?";

  db.query(sql, [id, user_id], (err) => {
    if (err) return res.json({ success: false });

    res.json({ success: true });
  });
});
// ADD HISTORY
app.post("/add-history", (req, res) => {
  const { user_id, title, poster, trailer } = req.body;

  const sql = "INSERT INTO history (user_id, title, poster, trailer) VALUES (?, ?, ?, ?)";

  db.query(sql, [user_id, title, poster, trailer], (err) => {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

// GET HISTORY
app.get("/history/:user_id", (req, res) => {
  const sql = "SELECT * FROM history WHERE user_id=?";
  db.query(sql, [req.params.user_id], (err, result) => {
    res.json(result);
  });
});

// 🗑️ CLEAR HISTORY
app.delete("/clear-history/:user_id", (req, res) => {
  const sql = "DELETE FROM history WHERE user_id=?";
  db.query(sql, [req.params.user_id], (err) => {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

// ❌ REMOVE SINGLE HISTORY ITEM
app.delete("/remove-history-item", (req, res) => {
  const { title, user_id } = req.body;
  
  const sql = "DELETE FROM history WHERE title=? AND user_id=?";
  db.query(sql, [title, user_id], (err) => {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

app.post("/update-password", (req, res) => {
  const { user_id, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.json({ success: false, message: "Hashing error" });
    const sql = "UPDATE users SET password=? WHERE id=?";
    db.query(sql, [hash, user_id], () => {
      res.json({ success: true });
    });
  });
});

// 🛠️ UPDATE PROFILE (Called by Navbar.js settings modal)
app.put("/update-profile/:id", (req, res) => {
  const userId = req.params.id;
  const { name, password } = req.body;

  if (name) {
    db.query("UPDATE users SET name=? WHERE id=?", [name, userId], (err) => {
      if (err) return res.status(500).json({ success: false, message: "DB error" });
      res.json({ success: true });
    });
  } else if (password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ success: false, message: "Hashing error" });
      db.query("UPDATE users SET password=? WHERE id=?", [hash, userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: "DB error" });
        res.json({ success: true });
      });
    });
  } else {
    res.status(400).json({ success: false, message: "No fields to update" });
  }
});

app.delete(["/delete-account", "/delete-account/:id"], (req, res) => {
  // Supports both req.body (from DeleteAccount.js) and req.params (from Navbar.js)
  const user_id = req.params.id || req.body.user_id;

  if (!user_id) {
    return res.status(400).json({ success: false, message: "User ID is required." });
  }

  // Use callbacks to ensure proper execution order and send response at the end
  db.query("DELETE FROM users WHERE id=?", [user_id], () => {
    db.query("DELETE FROM watchlist WHERE user_id=?", [user_id], () => {
      db.query("DELETE FROM history WHERE user_id=?", [user_id], () => {
        res.json({ success: true });
      });
    });
  });
});

// 🚀 SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
