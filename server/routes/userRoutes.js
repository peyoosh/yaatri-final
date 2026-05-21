const express = require('express');
const router = express.Router();
const User = require('../models/User');
const destinationService = require('../services/destinationService');
const { validateAdmin, protect } = require('../middleware/authMiddleware');

// PUT /api/users/profile — update the *logged-in* user's profile (avatar, bio, role-specific fields).
// Image data arrives as a Base64 data URL on req.body.avatar. Anything missing from the body is left untouched.
router.put('/profile', protect, async (req, res) => {
  try {
    const {
      avatar,
      bio,
      role,
      hotelName,
      amenities,
      baseRoomRate,
      languages,
      ratePerDay,
      licenseNumber,
      isVerified,
      favoriteDestinations,
      title,    // alias — accepted but stored on bio/experience as fallback context
      details,  // alias for free-form details → merged into bio if bio not present
    } = req.body || {};

    if (typeof avatar === 'string' && avatar.length > 0 && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(avatar)) {
      return res.status(400).json({ message: 'avatar must be a base64-encoded data URL (data:image/...;base64,...)' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Top-level fields
    if (typeof avatar === 'string') user.avatar = avatar;
    if (typeof bio === 'string') user.bio = bio;
    else if (typeof details === 'string') user.bio = details;
    if (typeof role === 'string' && ['user', 'guide', 'hotel'].includes(role) && !user.isAdmin) {
      user.role = role;
    }

    // Role-specific profileData fields — only persist what was sent.
    if (!user.profileData) user.profileData = {};
    if (typeof hotelName === 'string') user.profileData.hotelName = hotelName;
    if (Array.isArray(amenities)) user.profileData.amenities = amenities;
    if (typeof baseRoomRate === 'number') user.profileData.baseRoomRate = baseRoomRate;
    if (Array.isArray(languages)) user.profileData.languages = languages;
    if (typeof ratePerDay === 'number') user.profileData.ratePerDay = ratePerDay;
    if (typeof licenseNumber === 'string') user.profileData.licenseNumber = licenseNumber;
    if (typeof isVerified === 'boolean' && user.isAdmin) user.profileData.isVerified = isVerified;
    if (Array.isArray(favoriteDestinations)) user.profileData.favoriteDestinations = favoriteDestinations;
    if (typeof title === 'string') user.profileData.experience = title;

    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.status(200).json(safe);
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('PROFILE_UPDATE_ERROR', err);
    return res.status(400).json({ message: err.message || 'Failed to update profile' });
  }
});

// GET: Fetch all users for Admin Panel
router.get('/', validateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET: Fetch filtered users by role for the admin panel
router.get('/role/:role', validateAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: req.params.role }).select('-password').lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch personalized recommendations for a user
router.get('/:id/recommendations', protect, async (req, res) => {
  try {
    if (String(req.user._id) !== String(req.params.id) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view recommendations for this user' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const recommendations = await destinationService.getPersonalizedRecommendations(user);
    res.json(recommendations);
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET: Fetch user by ID for profile view
router.get('/:id', protect, async (req, res) => {
  try {
    const isOwner = String(req.user._id) === String(req.params.id);
    if (isOwner || req.user.isAdmin) {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    }

    // Public-safe projection for other authenticated users
    const user = await User.findById(req.params.id).select('username bio joinDate role');
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
    if (String(req.user._id) !== String(req.params.id) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const allowedKeys = ['username', 'email', 'phoneNumber', 'preferences', 'bio'];
    const updatePayload = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) updatePayload[key] = req.body[key];
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updatePayload,
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
    
    const user = await User.findById(req.user._id);
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
      return res.status(404).json({ error: 'BOOKING_NOT_FOUND', message: 'No trip history entry matches that booking id.' });
    }

    user.tripHistory[bookingIndex].rating = Number(rating);
    user.tripHistory[bookingIndex].comment = comment;

    await user.save();
    res.json({ message: 'Rating saved successfully', tripHistory: user.tripHistory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;