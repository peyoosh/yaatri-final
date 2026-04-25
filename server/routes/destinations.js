const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');

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
    res.status(200).json(destination);
  } catch (err) {
    console.error('Error fetching destination:', err);
    res.status(500).json({ error: 'Server error while retrieving the destination' });
  }
});

// @route   POST /api/destinations
// @desc    Create a new destination node
// @access  Private/Admin
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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