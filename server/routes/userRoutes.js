const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validateAdmin } = require('../middleware/authMiddleware');

// GET: Fetch all users for Admin Panel
router.get('/', validateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;