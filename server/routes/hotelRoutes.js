const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const { validateAdmin } = require('../middleware/authMiddleware');

const HOTEL_ALLOWED_FIELDS = ['name', 'totalRooms', 'bookedRooms', 'basePrice', 'features', 'phoneNumber', 'userId', 'isUserOwned'];

// @route   GET /api/hotels
// @desc    Get all hotels and label them based on occupancy
// @access  Public
router.get('/', async (req, res) => {
  try {
    const hotels = await Hotel.find().populate('userId', 'username email').lean();

    // Automatically label hotels as FULL if isFull is true
    const labeledHotels = hotels.map(hotel => {
      const hotelObj = hotel;
      if (hotelObj.isFull) {
        hotelObj.statusLabel = "FULL";
      } else {
        hotelObj.statusLabel = "AVAILABLE";
      }
      
      // For user-owned hotels, add username and email fields for compatibility
      if (hotelObj.userId) {
        hotelObj.username = hotelObj.userId.username;
        hotelObj.email = hotelObj.userId.email;
      }
      
      return hotelObj;
    });

    res.status(200).json(labeledHotels);
  } catch (err) {
    console.error('Error fetching hotels:', err);
    res.status(500).json({ error: 'Server error while retrieving hotels' });
  }
});

// @route   POST /api/hotels
// @desc    Create a new hotel
// @access  Private/Admin
router.post('/', validateAdmin, async (req, res) => {
  try {
    const safeBody = {};
    for (const key of HOTEL_ALLOWED_FIELDS) {
      if (req.body[key] !== undefined) safeBody[key] = req.body[key];
    }
    const newHotel = new Hotel(safeBody);
    const savedHotel = await newHotel.save();
    res.status(201).json(savedHotel);
  } catch (err) {
    console.error('Error creating hotel:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
