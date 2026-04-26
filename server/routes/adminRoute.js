const express = require('express');
const router = express.Router();
const { validateAdmin } = require('../middleware/authMiddleware');

router.get('/stats', validateAdmin, (req, res) => {
  res.json({
    users: 24, destinations: 12, blogs: 8, activeGuides: 5
  });
});

module.exports = router;