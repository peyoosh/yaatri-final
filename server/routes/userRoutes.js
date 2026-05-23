const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Destination = require('../models/Destination');
const Booking = require('../models/Booking');
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
      toggleFavoriteId, // dedicated push/pull on a single destination id — preferred over sending the full array
      title,    // alias — accepted but stored on bio/experience as fallback context
      details,  // alias for free-form details → merged into bio if bio not present
    } = req.body || {};

    if (typeof avatar === 'string' && avatar.length > 0 && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(avatar)) {
      return res.status(400).json({ message: 'avatar must be a base64-encoded data URL (data:image/...;base64,...)' });
    }

    // Need +avatar so the new value (or the existing one) round-trips through save() correctly.
    const user = await User.findById(req.user._id).select('+avatar');
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

    // Server-side push/pull on a single favourite. Keeps the array as the canonical source of truth
    // and avoids race conditions when the client computes the new array from a stale snapshot.
    if (typeof toggleFavoriteId === 'string' && toggleFavoriteId.length > 0) {
      const current = (user.profileData.favoriteDestinations || []).map(String);
      const idx = current.indexOf(String(toggleFavoriteId));
      if (idx >= 0) {
        current.splice(idx, 1); // pull
      } else {
        current.push(String(toggleFavoriteId)); // push
      }
      user.profileData.favoriteDestinations = current;
      // Mongoose nested-array mutation tracking — make the change visible to save().
      user.markModified('profileData.favoriteDestinations');
    }

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
      // Owner or admin gets the full profile including the (heavy) avatar.
      const user = await User.findById(req.params.id).select('-password +avatar');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    }

    // Public-safe projection for other authenticated users — still includes the
    // avatar so profile cards across the app can render their portrait.
    const user = await User.findById(req.params.id).select('username bio joinDate role +avatar');
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

// GET /api/users/:id/role-stats
// Aggregates live booking data for a hotel-owner OR guide so their profile page can
// surface real revenue + upcoming reservations. Owner or admin only.
//
// Hotel-owner shape:
//   { role: 'hotel', hotelId, hotelName, assignedDestinations: [...],
//     totalBookings, totalRevenue, upcomingReservations: [...], pastReservations: [...] }
//
// Guide shape:
//   { role: 'guide', assignedDestinations: [...], totalEngagements, totalEarnings,
//     upcomingEngagements: [...], pastEngagements: [...] }
router.get('/:id/role-stats', protect, async (req, res) => {
  try {
    const isOwner = String(req.user._id) === String(req.params.id);
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Only the user or an admin can view role stats.' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const role = user.role;

    // ---------- HOTEL-OWNER PATH ----------
    if (role === 'hotel' || role === 'hotel_owner') {
      const hotel = await Hotel.findOne({ userId: user._id }).lean();
      const assignedDestinations = hotel
        ? await Destination.find({ assignedHotels: hotel._id })
            .select('_id name region terrainType')
            .lean()
        : [];

      const destIds = assignedDestinations.map((d) => d._id);
      const bookings = destIds.length
        ? await Booking.find({ destination: { $in: destIds } })
            .populate('destination', 'name region')
            .populate('user', 'username email')
            .sort({ startDate: 1, createdAt: -1 })
            .lean()
        : [];

      let totalRevenue = 0;
      const upcoming = [];
      const past = [];
      const now = Date.now();

      for (const b of bookings) {
        const total = Number(b?.pricing?.totalCost || 0);
        if (b.status !== 'cancelled') totalRevenue += total;

        const isFuture = b.startDate && new Date(b.startDate).getTime() >= now;
        if (['pending', 'confirmed'].includes(b.status) && isFuture) upcoming.push(b);
        else past.push(b);
      }

      return res.json({
        role: 'hotel',
        hotelId: hotel?._id || null,
        hotelName: hotel?.name || user.profileData?.hotelName || `${user.username}'s Hotel`,
        basePrice: hotel?.basePrice || 0,
        assignedDestinations,
        totalBookings: bookings.length,
        totalRevenue,
        upcomingReservations: upcoming.slice(0, 10),
        pastReservations: past.slice(0, 10),
        currency: 'NPR',
        timestamp: new Date().toISOString(),
      });
    }

    // ---------- GUIDE PATH ----------
    if (role === 'guide') {
      const assignedDestinations = await Destination.find({ assignedGuides: user._id })
        .select('_id name region terrainType')
        .lean();

      const destIds = assignedDestinations.map((d) => d._id);
      // Treat guide engagements as bookings on assigned destinations that explicitly include the guide add-on.
      const bookings = destIds.length
        ? await Booking.find({ destination: { $in: destIds }, 'pricing.addOns': 'guide' })
            .populate('destination', 'name region')
            .populate('user', 'username')
            .sort({ startDate: 1, createdAt: -1 })
            .lean()
        : [];

      // Earnings ≈ NPR 1,500 per traveller per day per booking (matches the add-on rate used at booking time).
      const GUIDE_RATE = 1500;
      let totalEarnings = 0;
      const upcoming = [];
      const past = [];
      const now = Date.now();

      for (const b of bookings) {
        if (b.status !== 'cancelled') {
          totalEarnings += GUIDE_RATE * Number(b.travelers || 1) * Number(b.durationDays || 1);
        }
        const isFuture = b.startDate && new Date(b.startDate).getTime() >= now;
        if (['pending', 'confirmed'].includes(b.status) && isFuture) upcoming.push(b);
        else past.push(b);
      }

      return res.json({
        role: 'guide',
        assignedDestinations,
        totalEngagements: bookings.length,
        totalEarnings,
        upcomingEngagements: upcoming.slice(0, 10),
        pastEngagements: past.slice(0, 10),
        currency: 'NPR',
        timestamp: new Date().toISOString(),
      });
    }

    // Travelers / admins fall back to a lightweight shape so the same endpoint can be polled by any profile.
    return res.json({
      role,
      totalBookings: 0,
      totalRevenue: 0,
      upcomingReservations: [],
      currency: 'NPR',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('ROLE_STATS_ERROR', err);
    res.status(500).json({ message: err.message || 'Failed to fetch role stats' });
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