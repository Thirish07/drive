

const jwt = require("jsonwebtoken"); 
const redisClient = require("../config/redis");
const pool = require("../config/db");

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("🧪 Access token received:", token);
  const sharedToken = req.headers["x-shared-token"];

  try {
    // ✅ Case 1: Logged-in user (accessToken present)
    if (token) {
      const isBlacklisted = await redisClient.get(token);
      if (isBlacklisted) {
        return res.status(401).json({ error: "Token is blacklisted (logged out)" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Step 1: Check if user still exists
      const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.userId]);

      if (userRes.rows.length === 0) {
        return res.status(403).json({ error: "User no longer exists" });
      }

      req.user = decoded;
      return next();
    }

    // ✅ Case 2: Visiting shared link with x-shared-token
    if (sharedToken) {
      const folderRes = await pool.query(`SELECT * FROM shared_folder_tokens WHERE token = $1`, [sharedToken]);
      const fileRes = await pool.query(`SELECT * FROM shared_file_tokens WHERE token = $1`, [sharedToken]);

      const shared = folderRes.rows[0] || fileRes.rows[0];
      if (!shared) {
        return res.status(403).json({ error: "Invalid or expired shared token" });
      }

      // ✅ Require user to login first
      if (!req.user) {
        return res.status(401).json({ error: "Please login to access shared content." });
      }

      // ✅ Check if the logged-in user's email matches the shared email
      const user = await pool.query(`SELECT email FROM users WHERE id = $1`, [req.user.userId]);
      const email = user.rows[0]?.email;

      if (!email || email.toLowerCase() !== shared.email.toLowerCase()) {
        return res.status(403).json({ error: "Access denied: This token was not shared with your email." });
      }

      req.isSharedAccess = true;
      return next();
    }

    // ❌ Neither logged in nor has valid shared token
    return res.status(401).json({ error: "Unauthorized: No valid token found" });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(403).json({ error: "Token verification failed" });
  }
};
