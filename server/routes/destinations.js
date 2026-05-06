const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateAdmin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { destinationSchema } = require('../validations/schemas');
const destinationService = require('../services/destinationService');

const JWT_SECRET = process.env.JWT_SECRET || "YAATRI_CORE_ENCRYPTION_KEY";

// @route   GET /api/destinations
// @desc    Get all destinations (personalized if logged in, otherwise sorted by popularity)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    let user = null;
    
    // Check for optional auth token to personalize results
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        user = await User.findById(decoded.id);
      } catch (e) {
        console.warn("Invalid token for personalization, falling back to public ranking.");
      }
    }

    const destinations = await destinationService.getAllDestinations(user);
    res.status(200).json(destinations);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/destinations/:id
// @desc    Get a single destination by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const destinationObj = await destinationService.getDestinationById(req.params.id);
      
    if (!destinationObj) {
      const err = new Error('Destination not found');
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json(destinationObj);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/destinations
// @desc    Create a new destination node
// @access  Private/Admin
router.post('/', validateAdmin, validate(destinationSchema), async (req, res, next) => {
  try {
    const savedDestination = await destinationService.createDestination(req.body);
    res.status(201).json(savedDestination);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/destinations/:id
// @desc    Update an existing destination node
// @access  Private/Admin
router.put('/:id', validateAdmin, validate(destinationSchema), async (req, res, next) => {
  try {
    const updatedDestination = await destinationService.updateDestination(req.params.id, req.body);
    if (!updatedDestination) {
      const err = new Error('Destination not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json(updatedDestination);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/destinations/:id
// @desc    Purge a destination node
// @access  Private/Admin
router.delete('/:id', validateAdmin, async (req, res, next) => {
  try {
    const deletedDestination = await destinationService.deleteDestination(req.params.id);
    if (!deletedDestination) {
      const err = new Error('Destination not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ message: 'Destination node purged successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;