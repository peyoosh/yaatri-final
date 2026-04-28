const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');

// @route   GET /api/hotels
// @desc    Get all hotels and label them based on occupancy
// @access  Public
router.get('/', async (req, res) => {
  try {
    const hotels = await Hotel.find();
    
    // Automatically label hotels as FULL if isFull is true
    const labeledHotels = hotels.map(hotel => {
      const hotelObj = hotel.toObject({ virtuals: true });
      if (hotelObj.isFull) {
        hotelObj.statusLabel = "FULL";
      } else {
        hotelObj.statusLabel = "AVAILABLE";
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
// @access  Public (should probably be Admin, but keeping it open for now)
router.post('/', async (req, res) => {
  try {
    const newHotel = new Hotel(req.body);
    const savedHotel = await newHotel.save();
    res.status(201).json(savedHotel);
  } catch (err) {
    console.error('Error creating hotel:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
