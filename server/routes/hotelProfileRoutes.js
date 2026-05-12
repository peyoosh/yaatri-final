const express = require('express');
const router = express.Router();
const HotelProfile = require('../models/HotelProfile');
const { protect } = require('../middleware/authMiddleware');

// GET: Hotel profile for current user
router.get('/profile', protect, async (req, res) => {
  try {
    let hotelProfile = await HotelProfile.findOne({ userId: req.user._id });

    if (!hotelProfile) {
      // Create default hotel profile for user
      hotelProfile = new HotelProfile({
        userId: req.user._id,
        hotelName: req.user.username,
        basePrice: 0,
        rating: 0,
        description: ''
      });
      await hotelProfile.save();
    }

    res.json(hotelProfile);
  } catch (error) {
    console.error('Error fetching hotel profile:', error);
    res.status(500).json({ error: 'Failed to fetch hotel profile' });
  }
});

// PUT: Update hotel profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { hotelName, basePrice, rating, description, amenities } = req.body;

    let hotelProfile = await HotelProfile.findOne({ userId: req.user._id });

    if (!hotelProfile) {
      hotelProfile = new HotelProfile({ userId: req.user._id });
    }

    hotelProfile.hotelName = hotelName || hotelProfile.hotelName;
    hotelProfile.basePrice = basePrice !== undefined ? basePrice : hotelProfile.basePrice;
    hotelProfile.rating = rating !== undefined ? rating : hotelProfile.rating;
    hotelProfile.description = description || hotelProfile.description;
    hotelProfile.amenities = amenities || hotelProfile.amenities;

    await hotelProfile.save();
    res.json(hotelProfile);
  } catch (error) {
    console.error('Error updating hotel profile:', error);
    res.status(500).json({ error: 'Failed to update hotel profile' });
  }
});

// GET: All hotel profiles (for destination assignment)
router.get('/', async (req, res) => {
  try {
    const hotelProfiles = await HotelProfile.find()
      .populate('userId', 'username email')
      .lean();
    res.json(hotelProfiles);
  } catch (error) {
    console.error('Error fetching hotel profiles:', error);
    res.status(500).json({ error: 'Failed to fetch hotel profiles' });
  }
});

module.exports = router;
