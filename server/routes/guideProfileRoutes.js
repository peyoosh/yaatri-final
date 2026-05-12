const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');
const { protect } = require('../middleware/authMiddleware');

// GET: All guides (for admin and public access)
router.get('/', async (req, res) => {
  try {
    const guides = await Guide.find().populate('userId', 'username email').lean();
    res.json(guides);
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

// GET: Guide profile for current user
router.get('/profile', protect, async (req, res) => {
  try {
    let guide = await Guide.findOne({ userId: req.user._id });

    if (!guide) {
      // Create default guide profile for user
      guide = new Guide({
        userId: req.user._id,
        guideName: req.user.username,
        dailyFee: 0,
        rating: 0,
        bio: '',
        isVerified: false,
        expertise: []
      });
      await guide.save();
    }

    res.json(guide);
  } catch (error) {
    console.error('Error fetching guide profile:', error);
    res.status(500).json({ error: 'Failed to fetch guide profile' });
  }
});

// PUT: Update guide profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { guideName, dailyFee, rating, bio, expertise, isVerified } = req.body;

    let guide = await Guide.findOne({ userId: req.user._id });

    if (!guide) {
      guide = new Guide({ userId: req.user._id });
    }

    guide.guideName = guideName || guide.guideName;
    guide.dailyFee = dailyFee !== undefined ? dailyFee : guide.dailyFee;
    guide.rating = rating !== undefined ? rating : guide.rating;
    guide.bio = bio || guide.bio;
    guide.expertise = expertise || guide.expertise;
    guide.isVerified = isVerified !== undefined ? isVerified : guide.isVerified;

    await guide.save();
    res.json(guide);
  } catch (error) {
    console.error('Error updating guide profile:', error);
    res.status(500).json({ error: 'Failed to update guide profile' });
  }
});

// GET: All guides (for destination assignment)
router.get('/', async (req, res) => {
  try {
    const guides = await Guide.find()
      .populate('userId', 'username email')
      .lean();
    res.json(guides);
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

module.exports = router;
