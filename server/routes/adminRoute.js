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
// Also returns vendorLedger so admin hotel/guide managers can show pending payouts.
router.get('/providers', validateAdmin, async (req, res, next) => {
  try {
    const { role } = req.query;
    let filter = {};
    if (role === 'hotel' || role === 'hotel_owner') {
      // Accept either spelling — admin UI may request 'hotel_owner' (legacy) or 'hotel' (canonical).
      filter.role = { $in: ['hotel', 'hotel_owner'] };
    } else if (role) {
      filter.role = role;
    } else {
      filter.role = { $in: ['guide', 'hotel', 'hotel_owner'] }; // Defaults to all vendor roles
    }
    const providers = await User.find(filter)
      .select('username email role profileData vendorLedger status')
      .lean();
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

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACE FINANCIAL CONTROL — three-tier ledger endpoints
// ─────────────────────────────────────────────────────────────────────────────

// Statuses considered "captured revenue" for gross-total purposes. The spec
// lists the canonical three; we additively include the legacy 'pending' and
// 'confirmed' so historical bookings without canonical statuses still count.
const ACTIVE_BOOKING_STATUSES = ['escrow_held', 'approved', 'completed', 'pending', 'confirmed'];

// GET /api/admin/financials/overview
// Returns the 4 KPI tiles for the admin payout dashboard. Uses aggregation
// pipelines so the work happens inside Mongo, not in node memory.
router.get('/financials/overview', validateAdmin, async (req, res, next) => {
  try {
    const [grossAgg, platformAgg, forfeitAgg, hotelAgg, guideAgg, vendorCounts] = await Promise.all([
      // totalGrossRevenue: sum of grossTotal (or legacy totalCost) for non-cancelled bookings.
      Booking.aggregate([
        { $match: { status: { $in: ACTIVE_BOOKING_STATUSES } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$pricing.grossTotal', '$pricing.totalCost'] } } } },
      ]),
      // 15% platform commission from active bookings.
      Booking.aggregate([
        { $match: { status: { $in: ACTIVE_BOOKING_STATUSES } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$pricing.platformShare', 0] } } } },
      ]),
      // 20% structural forfeiture from cancelled bookings.
      Booking.aggregate([
        { $match: { status: 'cancelled' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$refund.forfeitedAmount', 0] } } } },
      ]),
      // Pending payout owed across all hotel-role users (canonical + legacy alias).
      User.aggregate([
        { $match: { role: { $in: ['hotel', 'hotel_owner'] } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$vendorLedger.pendingPayout', 0] } } } },
      ]),
      // Pending payout owed across all guide-role users.
      User.aggregate([
        { $match: { role: 'guide' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$vendorLedger.pendingPayout', 0] } } } },
      ]),
      // Bonus: vendor counts so the UI can show "owed to N hotels / M guides".
      Promise.all([
        User.countDocuments({ role: { $in: ['hotel', 'hotel_owner'] } }),
        User.countDocuments({ role: 'guide' }),
      ]),
    ]);

    const totalGrossRevenue = grossAgg[0]?.total || 0;
    const platformCommissionFromBookings = platformAgg[0]?.total || 0;
    const platformForfeitFromCancellations = forfeitAgg[0]?.total || 0;
    const platformNetEarnings = platformCommissionFromBookings + platformForfeitFromCancellations;
    const totalOwedToHotels = hotelAgg[0]?.total || 0;
    const totalOwedToGuides = guideAgg[0]?.total || 0;
    const [hotelCount, guideCount] = vendorCounts;

    res.json({
      currency: 'NPR',
      totalGrossRevenue,
      platformNetEarnings,
      platformBreakdown: {
        commission15Pct: platformCommissionFromBookings,
        cancellationForfeit20Pct: platformForfeitFromCancellations,
      },
      totalOwedToHotels,
      totalOwedToGuides,
      vendorCounts: { hotels: hotelCount, guides: guideCount },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/payouts/deduct
// Body: { vendorId: ObjectId, amountPaid: Number }
// Drains pendingPayout by `amountPaid` and credits totalWithdrawn by the same.
// Uses an atomic findOneAndUpdate with a balance guard so two concurrent
// admin actions can never overdraw the ledger.
router.post('/payouts/deduct', validateAdmin, async (req, res, next) => {
  try {
    const { vendorId, amountPaid } = req.body || {};

    if (!vendorId || !/^[0-9a-fA-F]{24}$/.test(String(vendorId))) {
      return res.status(400).json({ message: 'vendorId must be a valid ObjectId' });
    }
    const amt = Number(amountPaid);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ message: 'amountPaid must be a positive number' });
    }

    // Atomic + guarded: only matches if the vendor's pendingPayout can absorb this debit.
    const updated = await User.findOneAndUpdate(
      {
        _id: vendorId,
        role: { $in: ['hotel', 'hotel_owner', 'guide'] },
        'vendorLedger.pendingPayout': { $gte: amt },
      },
      {
        $inc: {
          'vendorLedger.pendingPayout': -amt,
          'vendorLedger.totalWithdrawn': amt,
        },
      },
      { new: true, runValidators: true, projection: 'username role email vendorLedger' }
    );

    if (!updated) {
      // Figure out which precondition failed so the admin gets a clear message.
      const existing = await User.findById(vendorId).select('role vendorLedger');
      if (!existing) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      if (!['hotel', 'hotel_owner', 'guide'].includes(existing.role)) {
        return res.status(400).json({ message: `User role "${existing.role}" cannot receive payouts (must be guide or hotel).` });
      }
      const have = Number(existing.vendorLedger?.pendingPayout || 0);
      return res.status(400).json({
        message: `Payout exceeds pending balance. Requested NPR ${amt.toLocaleString('en-IN')}, available NPR ${have.toLocaleString('en-IN')}.`,
      });
    }

    console.log(`[payouts] admin paid out NPR ${amt} to ${updated.username} (${vendorId})`);

    res.status(200).json({
      message: `Payout of NPR ${amt.toLocaleString('en-IN')} recorded for ${updated.username}.`,
      vendor: {
        _id: updated._id,
        username: updated.username,
        role: updated.role,
        email: updated.email,
      },
      vendorLedger: updated.vendorLedger,
      amountPaid: amt,
      currency: 'NPR',
      processedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

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