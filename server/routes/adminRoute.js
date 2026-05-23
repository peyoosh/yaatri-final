const express = require('express');
const router = express.Router();
const { validateAdmin } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { userRoleUpdateSchema } = require('../validations/schemas');
const User = require('../models/User');
const Destination = require('../models/Destination');
const Blog = require('../models/Blog');
const Hotel = require('../models/Hotel');
const Guide = require('../models/Guide');
const Booking = require('../models/Booking');

// GET /api/admin/stats — every number here is computed against live collections so
// the overview tiles update the moment a booking is placed / cancelled.
router.get('/stats', validateAdmin, async (req, res, next) => {
  try {
    const [users, destinations, blogs, activeGuides, hotels, bookings] = await Promise.all([
      User.countDocuments(),
      Destination.countDocuments(),
      Blog.countDocuments(),
      User.countDocuments({ role: 'guide' }),
      Hotel.countDocuments(),
      Booking.find({})
        .select('pricing status createdAt destination user')
        .populate('destination', 'name region')
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Revenue: sum of pricing.totalCost across all bookings whose status isn't 'cancelled'.
    let revenue = 0;
    let cancelledRevenue = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    for (const b of bookings) {
      const total = Number(b?.pricing?.totalCost || 0);
      if (b.status === 'cancelled') {
        cancelledRevenue += total;
        cancelledCount++;
      } else {
        revenue += total;
        if (b.status === 'pending') pendingCount++;
        else if (b.status === 'confirmed') confirmedCount++;
        else if (b.status === 'completed') completedCount++;
      }
    }

    // Traffic estimate — derived from real engagement signals until we wire
    // proper analytics. Replace with a tracker (PostHog/Plausible) later.
    const traffic = (destinations * 80) + (users * 12) + (blogs * 40) + (bookings.length * 25);

    // Top-destinations by booking count (drives the "Most Opted Nepal Routes" chart).
    const destCounts = new Map();
    for (const b of bookings) {
      const key = b?.destination?._id ? String(b.destination._id) : null;
      if (!key) continue;
      const entry = destCounts.get(key) || { _id: key, name: b.destination.name, region: b.destination.region, bookings: 0, revenue: 0 };
      entry.bookings += 1;
      if (b.status !== 'cancelled') entry.revenue += Number(b?.pricing?.totalCost || 0);
      destCounts.set(key, entry);
    }
    const topDestinations = Array.from(destCounts.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // Recent activity (live, derived from Bookings — replaces the previous static mock log).
    const recentActivity = bookings.slice(0, 8).map((b) => ({
      id: String(b._id),
      user: b?.user?.username || 'guest',
      action: b.status === 'cancelled'
        ? `Cancelled booking for ${b.destination?.name || 'a destination'}`
        : `Booked ${b.destination?.name || 'a destination'} (NPR ${Number(b.pricing?.totalCost || 0).toLocaleString('en-IN')})`,
      timestamp: b.createdAt,
      status: b.status,
    }));

    res.json({
      users,
      destinations,
      blogs,
      hotels,
      activeGuides,
      revenue,                       // NPR — net of cancellations
      cancelledRevenue,              // NPR — diagnostic, shown separately
      traffic,
      bookings: {
        total: bookings.length,
        pending: pendingCount,
        confirmed: confirmedCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
      topDestinations,
      recentActivity,
      currency: 'NPR',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH: Change a user's character/role
router.patch('/users/:id/role', validateAdmin, validate(userRoleUpdateSchema), async (req, res, next) => {
  try {
    const { role, pricePerNight, dailyFee } = req.body;

    // Get the user first to check current role
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }

    // Build the update object
    const updateData = { role };

    // Only persist role-scoped fields when relevant; null-out the opposite to avoid stale values across role switches
    if (role === 'hotel_owner') {
      if (pricePerNight !== undefined) updateData.pricePerNight = pricePerNight;
      updateData.dailyFee = null;
    } else if (role === 'guide') {
      if (dailyFee !== undefined) updateData.dailyFee = dailyFee;
      updateData.pricePerNight = null;
    } else {
      updateData.pricePerNight = null;
      updateData.dailyFee = null;
    }
    
    // Handle admin role - set isAdmin flag
    if (role === 'admin') {
      updateData.isAdmin = true;
    } else if (currentUser.role === 'admin' && role !== 'admin') {
      // If removing admin role, also remove isAdmin flag
      updateData.isAdmin = false;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Handle role-specific document creation
    if (role === 'hotel_owner' && pricePerNight !== undefined) {
      // Check if hotel already exists for this user
      const existingHotel = await Hotel.findOne({ userId: req.params.id });

      if (!existingHotel) {
        // Create new hotel for the user
        const hotel = new Hotel({
          name: `${updatedUser.username}'s Hotel`,
          basePrice: pricePerNight,
          totalRooms: 10, // Default rooms for user-owned hotels
          userId: req.params.id,
          isUserOwned: true,
          features: ['User-owned accommodation']
        });
        await hotel.save();
      } else {
        // Update existing hotel
        await Hotel.findOneAndUpdate(
          { userId: req.params.id },
          {
            basePrice: pricePerNight,
            name: existingHotel.name || `${updatedUser.username}'s Hotel`
          }
        );
      }
    }

    if (role === 'guide' && dailyFee !== undefined) {
      // Check if guide profile already exists
      const existingGuide = await Guide.findOne({ userId: req.params.id });

      if (!existingGuide) {
        // Create new guide profile
        const guideProfile = new Guide({
          userId: req.params.id,
          guideName: `${updatedUser.username} Guide`,
          dailyFee: dailyFee,
          bio: `Professional guide ${updatedUser.username}`,
          rating: 0,
          completedTours: 0,
          isVerified: true
        });
        await guideProfile.save();
      } else {
        // Update existing guide profile
        await Guide.findOneAndUpdate(
          { userId: req.params.id },
          {
            dailyFee: dailyFee,
            guideName: existingGuide.guideName || `${updatedUser.username} Guide`
          }
        );
      }
    }

    // If user was previously a hotel_owner or guide and is now something else, we could remove their profiles
    // But let's keep them for now in case they switch back

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