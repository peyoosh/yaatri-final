const express = require('express');
const router = express.Router();
const { validateAdmin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { userRoleUpdateSchema } = require('../validations/schemas');
const User = require('../models/User');
const Destination = require('../models/Destination');
const Blog = require('../models/Blog');

router.get('/stats', validateAdmin, async (req, res, next) => {
  try {
    const [users, destinations, blogs] = await Promise.all([
      User.countDocuments(),
      Destination.countDocuments(),
      Blog.countDocuments()
    ]);

    res.json({
      users, destinations, blogs, activeGuides: 5
    });
  } catch (error) {
    next(error);
  }
});

// PATCH: Change a user's character/role
router.patch('/users/:id/role', validateAdmin, validate(userRoleUpdateSchema), async (req, res, next) => {
  try {
    const { role } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// GET: Fetch users specifically by role to populate destination assignments
router.get('/providers', validateAdmin, async (req, res, next) => {
  try {
    const { role } = req.query;
    let filter = {};
    if (role) {
      filter.role = role;
    } else {
      filter.role = { $in: ['guide', 'hotel_owner'] }; // Defaults to fetch valid providers
    }
    const providers = await User.find(filter).select('username email role profileData').lean();
    res.json(providers);
  } catch (error) {
    next(error);
  }
});

// Admin add destination route fallback if any
router.post('/destinations', validateAdmin, async (req, res, next) => {
  // It looks like the destination manager calls /admin/destinations on POST
  try {
    const newDestination = new Destination(req.body);
    const savedDestination = await newDestination.save();
    res.status(201).json(savedDestination);
  } catch (err) {
    next(err);
  }
});

router.delete('/destinations/:id', validateAdmin, async (req, res, next) => {
  try {
    const deletedDestination = await Destination.findByIdAndDelete(req.params.id);
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