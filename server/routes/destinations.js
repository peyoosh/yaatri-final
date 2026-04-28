const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const { validateAdmin } = require('../middleware/authMiddleware');

const { getTravelAdvice, checkMountainClarity } = require('../utils/weatherLogic');

// @route   GET /api/destinations
// @desc    Get all destinations (sorted by popularity)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const destinations = await Destination.find().sort({ popularityScore: -1 });
    res.status(200).json(destinations);
  } catch (err) {
    console.error('Error fetching destinations:', err);
    res.status(500).json({ error: 'Server error while retrieving destinations' });
  }
});

// @route   GET /api/destinations/:id
// @desc    Get a single destination by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }

    // Mock weather data based on destination coordinates
    // In a real app, you would use destination.latitude and destination.longitude to call a weather API
    const mockTemp = Math.floor(Math.random() * 35); // Random temp between 0 and 35
    const mockWeatherCondition = Math.random() > 0.5 ? 'Clear' : 'Rain';
    const mockPastPrecipitation = Math.random() > 0.5;
    const isWaterBody = destination.environmentalTips?.isNaturalWaterBody || false;

    const clothingAdvice = getTravelAdvice(mockTemp, mockWeatherCondition, isWaterBody);
    const visibilityStatus = checkMountainClarity(mockWeatherCondition, mockPastPrecipitation);

    const liveAdvice = {
      weather: {
        temp: mockTemp,
        condition: mockWeatherCondition
      },
      clothingTips: clothingAdvice,
      visibilityStatus: visibilityStatus
    };

    // Convert mongoose document to plain object to attach liveAdvice
    const destinationObj = destination.toObject();
    destinationObj.liveAdvice = liveAdvice;

    res.status(200).json(destinationObj);
  } catch (err) {
    console.error('Error fetching destination:', err);
    res.status(500).json({ error: 'Server error while retrieving the destination' });
  }
});

// @route   POST /api/destinations
// @desc    Create a new destination node
// @access  Private/Admin
router.post('/', validateAdmin, async (req, res) => {
  try {
    const newDestination = new Destination(req.body);
    const savedDestination = await newDestination.save();
    res.status(201).json(savedDestination);
  } catch (err) {
    console.error('Error creating destination:', err);
    res.status(400).json({ error: err.message });
  }
});

// @route   PUT /api/destinations/:id
// @desc    Update an existing destination node
// @access  Private/Admin
router.put('/:id', validateAdmin, async (req, res) => {
  try {
    const updatedDestination = await Destination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDestination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.status(200).json(updatedDestination);
  } catch (err) {
    console.error('Error updating destination:', err);
    res.status(400).json({ error: err.message });
  }
});

// @route   DELETE /api/destinations/:id
// @desc    Purge a destination node
// @access  Private/Admin
router.delete('/:id', validateAdmin, async (req, res) => {
  try {
    const deletedDestination = await Destination.findByIdAndDelete(req.params.id);
    if (!deletedDestination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    res.status(200).json({ message: 'Destination node purged successfully' });
  } catch (err) {
    console.error('Error deleting destination:', err);
    res.status(500).json({ error: 'Server error while deleting the destination' });
  }
});

module.exports = router;