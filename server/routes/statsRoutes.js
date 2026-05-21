const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const User = require('../models/User');
const Guide = require('../models/Guide');

// GET: Fetch real-time metrics for dashboard
// Returns: locations count, users count, guides count, years active
router.get('/metrics', async (req, res) => {
  try {
    // Count destinations
    const destinationCount = await Destination.countDocuments();

    // Count total users
    const userCount = await User.countDocuments();

    // Count guides (users assigned the 'guide' role or holding a Guide profile)
    const guideUserCount = await User.countDocuments({ role: 'guide' });
    const guideCollectionCount = await Guide.countDocuments();
    const finalGuideCount = Math.max(guideUserCount, guideCollectionCount);

    // Calculate years active from the oldest joinDate (User schema has joinDate, not createdAt)
    const oldestUser = await User.findOne().sort({ joinDate: 1 }).select('joinDate');
    let yearsActive = 1;

    if (oldestUser && oldestUser.joinDate) {
      const joinedAt = new Date(oldestUser.joinDate);
      if (!Number.isNaN(joinedAt.getTime())) {
        const yearsDiff = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
        yearsActive = Math.max(1, Math.ceil(yearsDiff));
      }
    }

    // Calculate views as engagement metric
    const totalBlogs = await require('../models/Blog').countDocuments();
    const estimatedViews = (destinationCount * 500) + (userCount * 200) + (finalGuideCount * 1000) + (totalBlogs * 100);

    res.status(200).json({
      locations: destinationCount,
      users: userCount,
      guides: finalGuideCount,
      years: yearsActive,
      views: estimatedViews,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Stats metrics error:', err);
    res.sendError(500, 'STATS_FETCH_FAILED', 'Failed to fetch metrics', err.message);
  }
});

module.exports = router;
