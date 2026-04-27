const express = require('express');
const router = express.Router();
const { validateAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Destination = require('../models/Destination');
const Blog = require('../models/Blog');

router.get('/stats', validateAdmin, async (req, res) => {
  try {
    const [users, destinations, blogs] = await Promise.all([
      User.countDocuments(),
      Destination.countDocuments(),
      Blog.countDocuments()
    ]);

    res.json({
      users, destinations, blogs, activeGuides: 5
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch admin stats." });
  }
});

module.exports = router;