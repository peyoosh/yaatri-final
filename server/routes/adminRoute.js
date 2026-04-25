const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Destination = require('../models/Destination');
const Blog = require('../models/Blog');
const jwt = require('jsonwebtoken');

const JWT_SECRET = "YAATRI_CORE_ENCRYPTION_KEY";

// --- MIDDLEWARE: ADMIN SHIELD ---
const validateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "NO_TOKEN_PROVIDED" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "ADMIN_ACCESS_DENIED" });
    }
    next();
  } catch (err) {
    res.status(401).json({ error: "SESSION_EXPIRED" });
  }
};

// --- GET: SYSTEM STATS ---
// Resolves the 401/404 for /api/admin/stats
router.get('/stats', validateAdmin, async (req, res) => {
  try {
    const [userCount, nodeCount, blogCount] = await Promise.all([
      User.countDocuments(),
      Destination.countDocuments(),
      Blog.countDocuments()
    ]);

    res.json({
      userCount,
      activeNodes: nodeCount,
      intelStreams: blogCount
    });
  } catch (err) {
    res.status(500).json({ error: "STATS_FETCH_FAILURE" });
  }
});

module.exports = router;
