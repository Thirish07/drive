
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

const protect = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  // token blacklisted
  const isBlacklisted = await redisClient.get(token);
  if (isBlacklisted) {
    return res.status(401).json({ error: 'Token is blacklisted (logged out)' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });

    req.user = decoded;
 console.log("✅ Decoded user:", decoded);
    // ✅ Add this to confirm user is being attached
    //console.log("✅ protect.js decoded user:", decoded);

    next();
  });
};

module.exports = protect;
