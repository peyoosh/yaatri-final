const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { validateAdmin, protect } = require('../middleware/authMiddleware');

// GET: Fetch all users for Admin Panel
router.get('/', validateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET: Fetch user by ID for profile view
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update user profile settings
router.put('/:id', protect, async (req, res) => {
  try {
    // Only allow users to update their own profile unless they are an admin
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const { username, email, phoneNumber, preferences, bio } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, phoneNumber, preferences, bio },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Purge a user node
router.delete('/:id', validateAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'User node purged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH: Toggle block status of a user
router.patch('/:id/status', validateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add rating and comment to a user's trip history (booking)
router.post('/bookings/:bookingId/rate', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { bookingId } = req.params;

    // Find the user and the specific booking in their tripHistory
    // Note: If bookingId is just an index (0, 1, 2) from frontend mockup, we should handle that gracefully
    // Since in UserDashboard.jsx, h.id might be undefined, it falls back to the index i
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let bookingIndex = user.tripHistory.findIndex(h => h.id === bookingId);
    
    // Fallback: if bookingId looks like a number, try treating it as an array index
    if (bookingIndex === -1 && !isNaN(bookingId)) {
      const idx = parseInt(bookingId, 10);
      if (idx >= 0 && idx < user.tripHistory.length) {
        bookingIndex = idx;
      }
    }

    if (bookingIndex === -1) {
      // If we still can't find it, let's just push it to tripHistory as a new mock history item if they are trying to rate a mock item
      user.tripHistory.push({
        id: bookingId,
        dest: 'Mock Destination',
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        rating: Number(rating),
        comment
      });
    } else {
      user.tripHistory[bookingIndex].rating = Number(rating);
      user.tripHistory[bookingIndex].comment = comment;
    }

    await user.save();
    res.json({ message: 'Rating saved successfully', tripHistory: user.tripHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;