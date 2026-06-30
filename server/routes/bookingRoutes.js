const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Destination = require('../models/Destination');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const { protect, validateAdmin } = require('../middleware/authMiddleware');
const { sendMail } = require('../utils/mailer');
const { buildBookingInvoiceHTML, buildBookingInvoiceText } = require('../utils/invoiceTemplate');

// Tax tiers per the Yaatri invoicing spec.
const STATE_TAX_RATE = 0.04;  // 4%
const GST_RATE = 0.12;        // 12% — local VAT

// Marketplace economics per the three-tier vendor spec.
const PLATFORM_COMMISSION_RATE = 0.15;  // 15% of grossTotal stays with the platform
const VENDOR_SHARE_RATE = 0.85;          // 85% of grossTotal fanned out to active vendors
// Tiered cancellation policy — refund % depends on how far before the trip start.
// >7 days  → 80% back (20% forfeit)
// 2–7 days → 50% back (50% forfeit)
// <48 hrs  → 0% back  (100% forfeit — no-show tier)
// Before payment confirmed → 100% back (nothing charged yet)
const getCancellationRefundRate = (booking) => {
  if (booking.status === 'pending_payment') return 1.00; // nothing captured yet
  const start = booking.startDate ? new Date(booking.startDate) : null;
  if (!start || Number.isNaN(start.getTime())) return 0.80; // default if no date
  const hoursUntil = (start.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 0)   return 0.00; // trip already started
  if (hoursUntil < 48)  return 0.00;
  if (hoursUntil < 168) return 0.50; // < 7 days
  return 0.80;
};

// Credit a vendor user's ledger by `amount` (in NPR). `direction = +1` to credit,
// `-1` to reverse on cancellation. Updates totalEarned + pendingPayout atomically.
const updateVendorLedger = async (userId, amount, direction = 1) => {
  if (!userId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return;
  try {
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          'vendorLedger.totalEarned': direction * Number(amount),
          'vendorLedger.pendingPayout': direction * Number(amount),
        },
      },
      { new: false }
    );
  } catch (err) {
    console.warn(`[ledger] update failed for user ${userId}: ${err.message}`);
  }
};

// Flip every active booking whose endDate has passed → 'completed'.
// Catches both the new canonical lifecycle ('escrow_held', 'approved') AND the
// legacy lifecycle ('pending', 'confirmed') so historical rows still age out.
const sweepCompletedBookings = async () => {
  try {
    const result = await Booking.updateMany(
      {
        status: { $in: ['escrow_held', 'approved', 'pending', 'confirmed'] },
        endDate: { $ne: null, $lt: new Date() },
      },
      { $set: { status: 'completed' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[bookings] auto-completed ${result.modifiedCount} booking(s) whose trip end-date has passed`);
    }
    return result.modifiedCount;
  } catch (err) {
    console.warn('[bookings] sweep failed:', err.message);
    return 0;
  }
};

// POST /api/bookings  — confirm a booking. Server re-computes totals from the trusted payload to
// avoid client-side price tampering.
router.post('/', protect, async (req, res) => {
  try {
    const {
      destination,
      travelers,
      durationDays,
      startDate,
      endDate,
      addOns = [],
      baseRate,
      assignedGuideId,  // optional — any active guide
      assignedHotelId,  // optional — any active hotel
    } = req.body || {};

    if (!destination) return res.status(400).json({ message: 'destination is required' });
    const dest = await Destination.findById(destination);
    if (!dest) return res.status(400).json({ message: 'Selected destination does not exist' });

    const t = Number(travelers);
    const d = Number(durationDays);
    if (!Number.isFinite(t) || t < 1) return res.status(400).json({ message: 'travelers must be >= 1' });
    if (!Number.isFinite(d) || d < 1) return res.status(400).json({ message: 'durationDays must be >= 1' });

    // Date validation: startDate cannot be in the past (yesterday's midnight is the floor).
    // endDate is server-derived from startDate + durationDays so the client can't tamper with it.
    let parsedStart = null;
    if (startDate) {
      parsedStart = new Date(startDate);
      if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({ message: 'startDate is not a valid date' });
      }
      const todayFloor = new Date();
      todayFloor.setHours(0, 0, 0, 0);
      if (parsedStart < todayFloor) {
        return res.status(400).json({ message: 'startDate cannot be in the past' });
      }
    } else {
      parsedStart = new Date(); // default: today
      parsedStart.setHours(0, 0, 0, 0);
    }
    const parsedEnd = new Date(parsedStart);
    parsedEnd.setDate(parsedEnd.getDate() + d);

    // Use the client baseRate if provided, otherwise fall back to a sensible default.
    // (No destination.basePrice field exists on the Destination schema today — keep a default tier.)
    const safeBase = Number.isFinite(Number(baseRate)) && Number(baseRate) > 0 ? Number(baseRate) : 2500;

    // Add-on multipliers — each toggled add-on adds a flat fee per traveler per day.
    const addOnRates = { guide: 1500, 'premium-lodging': 2000, transport: 800, meals: 600 };
    const addOnList = Array.isArray(addOns) ? addOns.filter(a => addOnRates[a]) : [];

    // Guide: accept any verified guide, use their published dailyFee
    let resolvedGuideId = null;
    let effectiveGuideRate = addOnRates.guide;
    if (addOnList.includes('guide') && assignedGuideId) {
      const Guide = require('../models/Guide');
      try {
        const guide = await Guide.findById(assignedGuideId).select('dailyFee userId');
        if (guide) {
          resolvedGuideId = assignedGuideId;
          if (Number.isFinite(Number(guide.dailyFee)) && Number(guide.dailyFee) > 0) {
            effectiveGuideRate = Number(guide.dailyFee);
          }
        }
      } catch (_) { /* fall back to flat rate */ }
    }

    // Hotel: resolve selected hotel for notifications / ledger
    let resolvedHotelId = null;
    let effectiveHotelRate = addOnRates['premium-lodging'];
    if (addOnList.includes('premium-lodging') && assignedHotelId) {
      try {
        const hotel = await Hotel.findById(assignedHotelId).select('basePrice userId');
        if (hotel) {
          resolvedHotelId = assignedHotelId;
          if (Number.isFinite(Number(hotel.basePrice)) && Number(hotel.basePrice) > 0) {
            effectiveHotelRate = Number(hotel.basePrice);
          }
        }
      } catch (_) { /* fall back to flat rate */ }
    }

    const addOnPerPersonPerDay = addOnList.reduce((sum, a) => {
      if (a === 'guide') return sum + effectiveGuideRate;
      if (a === 'premium-lodging') return sum + effectiveHotelRate;
      return sum + addOnRates[a];
    }, 0);

    const subtotal = safeBase * t * d;
    const addOnTotal = addOnPerPersonPerDay * t * d;
    const beforeTax = subtotal + addOnTotal;
    const stateTax = Math.round(beforeTax * STATE_TAX_RATE);
    const gst = Math.round(beforeTax * GST_RATE);
    const vatAmount = stateTax + gst; // kept populated for backward compatibility with legacy UI reads
    const totalCost = beforeTax + stateTax + gst;

    // Marketplace settlement snapshot (NEW).
    const grossTotal = totalCost;                                      // alias — same number, new canonical name
    const platformShare = Math.round(grossTotal * PLATFORM_COMMISSION_RATE);
    const vendorShare = grossTotal - platformShare;                    // exact remainder (avoids rounding drift)

    const booking = await Booking.create({
      user: req.user._id,
      destination,
      assignedGuide: resolvedGuideId,
      assignedHotel: resolvedHotelId,
      travelers: t,
      durationDays: d,
      pricing: {
        baseRate: safeBase,
        addOns: addOnList,
        addOnTotal,                  // legacy
        addOnsTotal: addOnTotal,     // new canonical spelling — kept in sync
        subtotal,
        stateTax,
        gst,
        vatPercent: 16,
        vatAmount,
        totalCost,                   // legacy
        grossTotal,                  // new canonical name
        platformShare,
        vendorShare,
        currency: 'NPR',
      },
      startDate: parsedStart,
      endDate: parsedEnd,
      // Canonical lifecycle starts at pending_payment. Traveller marks paid → escrow_held;
      // admin verifies → approved; sweep flips → completed once endDate elapses.
      status: 'pending_payment',
    });

    // Credit vendor ledgers per the 85/15 split. The vendorShare is distributed:
    //  - assigned guide receives 85% of (their guide rate × travelers × days)
    //  - each linked hotel-owner splits the remainder evenly
    // This is a best-effort attribution; if no vendors are linked, the platform
    // effectively keeps everything (vendorShare stays unclaimed on the booking).
    setImmediate(async () => {
      try {
        let guideShareAllocated = 0;
        if (resolvedGuideId && addOnList.includes('guide')) {
          // Guide gets 85% of their direct add-on contribution to gross.
          const guideGross = effectiveGuideRate * t * d;
          guideShareAllocated = Math.round(guideGross * VENDOR_SHARE_RATE);
          await updateVendorLedger(resolvedGuideId, guideShareAllocated, +1);
        }
        const remainingVendorShare = Math.max(0, vendorShare - guideShareAllocated);
        if (remainingVendorShare > 0 && Array.isArray(dest.assignedHotels) && dest.assignedHotels.length > 0) {
          const hotels = await Hotel.find({ _id: { $in: dest.assignedHotels } }).select('userId').lean();
          const owners = hotels.map((h) => h.userId).filter(Boolean);
          if (owners.length > 0) {
            const perOwner = Math.floor(remainingVendorShare / owners.length);
            // Distribute floored shares; the platform absorbs the rounding fragment.
            await Promise.all(owners.map((uid) => updateVendorLedger(uid, perOwner, +1)));
          }
        }
      } catch (ledgerErr) {
        console.warn('[ledger] booking credit error (non-fatal):', ledgerErr.message);
      }
    });

    const populated = await Booking.findById(booking._id)
      .populate('destination', 'name region imageURL')
      .populate('assignedGuide', 'username profileData.experience profileData.ratePerDay');

    // Fire-and-forget notification fan-out — must NEVER block or fail the booking response.
    // The mailer itself gracefully skips when SMTP_HOST is not configured.
    setImmediate(async () => {
      const destName = populated.destination?.name || 'this trip';
      const destRegion = populated.destination?.region || '';
      const formatNPR = (n) => `NPR ${Number(n || 0).toLocaleString('en-IN')}`;
      const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      const refShort = String(populated._id).slice(-8).toUpperCase();

      // ---- 1) Invoice to the traveller ----
      try {
        const travelerDoc = await User.findById(req.user._id).select('username email');
        if (!travelerDoc?.email) {
          console.warn(`[bookings] no email on file for user ${req.user._id} — skipping invoice send`);
        } else {
          const html = buildBookingInvoiceHTML({ booking: populated.toObject(), user: travelerDoc.toObject(), destination: populated.destination });
          const text = buildBookingInvoiceText({ booking: populated.toObject(), user: travelerDoc.toObject(), destination: populated.destination });
          const subject = `Your Yaatri booking is confirmed — ${destName} (${formatNPR(totalCost)})`;
          await sendMail({ to: travelerDoc.email, subject, html, text });
        }
      } catch (mailErr) {
        console.error('[bookings] invoice email error (non-fatal):', mailErr.message);
      }

      // ---- 2) Engagement notice to the assigned guide (if one was picked) ----
      if (resolvedGuideId) {
        try {
          const guideDoc = await User.findById(resolvedGuideId).select('username email profileData.ratePerDay');
          if (guideDoc?.email) {
            const guideRate = Number(guideDoc.profileData?.ratePerDay) > 0 ? Number(guideDoc.profileData.ratePerDay) : effectiveGuideRate;
            const guideEarnings = guideRate * t * d;
            const guideSubject = `New trip assignment — ${destName} on ${formatDate(parsedStart)}`;
            const guideHtml = `
              <div style="font-family:'Segoe UI',sans-serif; background:#0D0A02; color:#F4F2F3; padding:24px; max-width:560px; margin:0 auto; border:1px solid #2A3A3F; border-radius:10px;">
                <p style="margin:0 0 8px; font-size:11px; letter-spacing:3px; color:#A2D729; font-weight:800;">YAATRI · NEW ENGAGEMENT</p>
                <h2 style="margin:0 0 16px; font-size:20px;">You've been assigned a trip to ${destName}${destRegion ? ` · ${destRegion}` : ''}</h2>
                <table cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px; margin-bottom:18px;">
                  <tr><td style="opacity:0.6; padding:4px 0; width:140px;">Booking ref</td><td style="font-family:monospace; color:#A2D729;">${refShort}</td></tr>
                  <tr><td style="opacity:0.6; padding:4px 0;">Travel window</td><td>${formatDate(parsedStart)} → ${formatDate(parsedEnd)}</td></tr>
                  <tr><td style="opacity:0.6; padding:4px 0;">Travelers</td><td>${t} · ${d} day${d > 1 ? 's' : ''}</td></tr>
                  <tr><td style="opacity:0.6; padding:4px 0;">Your est. earnings</td><td style="color:#A2D729; font-weight:700;">${formatNPR(guideEarnings)} (${formatNPR(guideRate)}/day × ${t}p × ${d}d)</td></tr>
                  <tr><td style="opacity:0.6; padding:4px 0;">Status</td><td><strong>${populated.status.toUpperCase()}</strong></td></tr>
                </table>
                <p style="margin:0 0 12px; font-size:13px; opacity:0.8; line-height:1.6;">Sign in to your Yaatri dashboard to see all your engagements, confirm preparation details, and contact the traveller.</p>
                <p style="margin:0; font-size:11px; opacity:0.5;">— Yaatri Hub</p>
              </div>
            `;
            const guideText = [
              `New engagement assigned to you`,
              ``,
              `Trip:       ${destName}${destRegion ? ' · ' + destRegion : ''}`,
              `Window:     ${formatDate(parsedStart)} → ${formatDate(parsedEnd)}`,
              `Travelers:  ${t} (${d} days)`,
              `Earnings:   ${formatNPR(guideEarnings)}`,
              `Ref:        ${refShort}`,
              ``,
              `Sign in to your Yaatri dashboard to see details.`,
            ].join('\n');
            await sendMail({ to: guideDoc.email, subject: guideSubject, html: guideHtml, text: guideText });
          } else {
            console.warn(`[bookings] guide ${resolvedGuideId} has no email — engagement notice skipped`);
          }
        } catch (mailErr) {
          console.error('[bookings] guide notification error (non-fatal):', mailErr.message);
        }
      }

      // ---- 3) Reservation notice to every hotel-owner whose hotel is assigned to this destination ----
      try {
        const hotelIds = (populated.destination?.assignedHotels) || [];
        // populated.destination doesn't auto-include assignedHotels — re-fetch with that field.
        const destFull = hotelIds.length
          ? populated.destination
          : await Destination.findById(populated.destination._id).select('assignedHotels').lean();
        const ids = (destFull?.assignedHotels) || [];
        if (ids.length === 0) {
          // Nothing to notify — destination has no hotels linked. Quietly skip.
        } else {
          const hotels = await Hotel.find({ _id: { $in: ids } }).select('_id name userId').lean();
          const ownerIds = hotels.map((h) => h.userId).filter(Boolean);
          if (ownerIds.length === 0) {
            // Hotels exist but none are user-owned — nothing to do.
          } else {
            const owners = await User.find({ _id: { $in: ownerIds } }).select('username email').lean();
            await Promise.all(owners.filter((o) => o.email).map(async (owner) => {
              try {
                const hotelName = hotels.find((h) => String(h.userId) === String(owner._id))?.name || owner.username;
                const hotelSubject = `New reservation on ${destName} — ${formatDate(parsedStart)}`;
                const hotelHtml = `
                  <div style="font-family:'Segoe UI',sans-serif; background:#0D0A02; color:#F4F2F3; padding:24px; max-width:560px; margin:0 auto; border:1px solid #2A3A3F; border-radius:10px;">
                    <p style="margin:0 0 8px; font-size:11px; letter-spacing:3px; color:#A2D729; font-weight:800;">YAATRI · NEW RESERVATION</p>
                    <h2 style="margin:0 0 16px; font-size:20px;">${hotelName} — incoming booking on ${destName}</h2>
                    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px; margin-bottom:18px;">
                      <tr><td style="opacity:0.6; padding:4px 0; width:140px;">Booking ref</td><td style="font-family:monospace; color:#A2D729;">${refShort}</td></tr>
                      <tr><td style="opacity:0.6; padding:4px 0;">Destination</td><td>${destName}${destRegion ? ` · ${destRegion}` : ''}</td></tr>
                      <tr><td style="opacity:0.6; padding:4px 0;">Travel window</td><td>${formatDate(parsedStart)} → ${formatDate(parsedEnd)}</td></tr>
                      <tr><td style="opacity:0.6; padding:4px 0;">Party size</td><td>${t} traveller${t > 1 ? 's' : ''} · ${d} night${d > 1 ? 's' : ''}</td></tr>
                      <tr><td style="opacity:0.6; padding:4px 0;">Booking total</td><td style="color:#A2D729; font-weight:700;">${formatNPR(totalCost)}</td></tr>
                      <tr><td style="opacity:0.6; padding:4px 0;">Status</td><td><strong>${populated.status.toUpperCase()}</strong></td></tr>
                    </table>
                    <p style="margin:0 0 12px; font-size:13px; opacity:0.8; line-height:1.6;">Sign in to your Yaatri dashboard to prepare for the stay, view occupancy, and update your hotel availability.</p>
                    <p style="margin:0; font-size:11px; opacity:0.5;">— Yaatri Hub</p>
                  </div>
                `;
                const hotelText = [
                  `New reservation incoming for ${hotelName}`,
                  ``,
                  `Destination:  ${destName}${destRegion ? ' · ' + destRegion : ''}`,
                  `Window:       ${formatDate(parsedStart)} → ${formatDate(parsedEnd)}`,
                  `Party:        ${t} guest${t > 1 ? 's' : ''} (${d} night${d > 1 ? 's' : ''})`,
                  `Total:        ${formatNPR(totalCost)}`,
                  `Ref:          ${refShort}`,
                  ``,
                  `Sign in to your Yaatri dashboard for details.`,
                ].join('\n');
                await sendMail({ to: owner.email, subject: hotelSubject, html: hotelHtml, text: hotelText });
              } catch (perOwnerErr) {
                console.warn(`[bookings] hotel-owner notify failed for ${owner.email}: ${perOwnerErr.message}`);
              }
            }));
          }
        }
      } catch (mailErr) {
        console.error('[bookings] hotel notification fan-out error (non-fatal):', mailErr.message);
      }
    });

    res.status(201).json(populated);
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    console.error('BOOKING_CREATE_ERROR', err);
    return res.status(400).json({ message: err.message || 'Failed to create booking' });
  }
});

// GET /api/bookings/me  — return the logged-in user's bookings.
router.get('/me', protect, async (req, res) => {
  try {
    await sweepCompletedBookings(); // ensure any newly-elapsed trips flip before the user sees their list
    const list = await Booking.find({ user: req.user._id })
      .populate('destination', 'name region imageURL')
      .populate('assignedGuide', 'guideName dailyFee userId')
      .populate('assignedHotel', 'name basePrice userId')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/bookings/:id/cancel — user cancels their own booking. Sends a confirmation
// email receipt via the mailer (graceful-skips if SMTP isn't configured).
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('destination', 'name region');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Ownership check — only the booker (or an admin) may cancel.
    const isOwner = String(booking.user) === String(req.user._id);
    if (!isOwner && !req.user.isAdmin) {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Completed bookings cannot be cancelled.' });
    }

    // Marketplace policy: 20% structural forfeit, 80% refundable to the traveller.
    const gross = Number(booking.pricing?.grossTotal || booking.pricing?.totalCost || 0);
    const refundRate = getCancellationRefundRate(booking);
    const eligibleAmount = Math.round(gross * refundRate);
    const forfeitedAmount = gross - eligibleAmount;

    booking.status = 'cancelled';
    booking.refund = {
      eligibleAmount,
      forfeitedAmount,
      processedAt: new Date(),
    };
    await booking.save();

    // Reverse any vendor ledger credits that were applied when the booking was placed.
    // We re-derive the same per-vendor amounts to keep totalEarned/pendingPayout in sync
    // (no double-bookkeeping needed because we credit at booking time, debit at cancel).
    setImmediate(async () => {
      try {
        const dest = await Destination.findById(booking.destination?._id || booking.destination).select('assignedHotels').lean();
        const grossVendorShare = Number(booking.pricing?.vendorShare || Math.round(gross * VENDOR_SHARE_RATE));

        // Guide reversal: same formula as the POST handler.
        let guideShareReversed = 0;
        if (booking.assignedGuide && (booking.pricing?.addOns || []).includes('guide')) {
          const guide = await User.findById(booking.assignedGuide).select('profileData.ratePerDay');
          const guideRate = Number(guide?.profileData?.ratePerDay) > 0 ? Number(guide.profileData.ratePerDay) : 1500;
          const guideGross = guideRate * Number(booking.travelers || 1) * Number(booking.durationDays || 1);
          guideShareReversed = Math.round(guideGross * VENDOR_SHARE_RATE);
          await updateVendorLedger(booking.assignedGuide, guideShareReversed, -1);
        }

        const remainingForHotels = Math.max(0, grossVendorShare - guideShareReversed);
        if (remainingForHotels > 0 && Array.isArray(dest?.assignedHotels) && dest.assignedHotels.length > 0) {
          const hotels = await Hotel.find({ _id: { $in: dest.assignedHotels } }).select('userId').lean();
          const owners = hotels.map((h) => h.userId).filter(Boolean);
          if (owners.length > 0) {
            const perOwner = Math.floor(remainingForHotels / owners.length);
            await Promise.all(owners.map((uid) => updateVendorLedger(uid, perOwner, -1)));
          }
        }
      } catch (ledgerErr) {
        console.warn('[ledger] cancellation reversal error (non-fatal):', ledgerErr.message);
      }
    });

    // Fire-and-forget cancellation receipt — never block or fail the response.
    setImmediate(async () => {
      try {
        const userDoc = await User.findById(booking.user).select('username email');
        if (!userDoc?.email) {
          console.warn(`[bookings] cancellation: no email for user ${booking.user} — receipt skipped`);
          return;
        }
        const destName = booking.destination?.name || 'your trip';
        const grossOnFile = Number(booking.pricing?.grossTotal || booking.pricing?.totalCost || 0);
        const refundEligible = Number(booking.refund?.eligibleAmount || 0);
        const forfeit = Number(booking.refund?.forfeitedAmount || 0);
        const refundPct = grossOnFile > 0 ? Math.round((refundEligible / grossOnFile) * 100) : 0;
        const forfeitPct = 100 - refundPct;
        const subject = `Your Yaatri booking has been cancelled — ${destName}`;
        const text = [
          `Hi ${userDoc.username || 'traveller'},`,
          '',
          `We've cancelled your booking for ${destName}.`,
          '',
          `Booking ref:        ${String(booking._id).slice(-8).toUpperCase()}`,
          `Status:             CANCELLED`,
          `Amount on file:     NPR ${grossOnFile.toLocaleString('en-IN')}`,
          `Refund eligible:    NPR ${refundEligible.toLocaleString('en-IN')}  (${refundPct}%)`,
          `Cancellation fee:   NPR ${forfeit.toLocaleString('en-IN')}  (${forfeitPct}% — tiered policy)`,
          '',
          refundEligible > 0 ? 'Refunds are processed within 5–7 business days.' : 'No refund applies under the <48-hour or post-departure cancellation policy.',
          'Reply to this email if anything looks wrong.',
          '',
          '— Yaatri Hub',
        ].join('\n');
        const html = `
          <div style="font-family: 'Segoe UI', sans-serif; background:#0D0A02; color:#F4F2F3; padding:24px; max-width:560px; margin:0 auto; border:1px solid #2A3A3F; border-radius:10px;">
            <p style="margin:0 0 8px; font-size:12px; letter-spacing:3px; color:#A2D729; font-weight:800;">YAATRI · BOOKING CANCELLED</p>
            <h2 style="margin:0 0 16px; font-size:22px;">Trip to ${destName} cancelled</h2>
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px;">
              <tr><td style="opacity:0.6; padding:4px 0; width:160px;">Booking ref</td><td style="font-family:monospace; color:#A2D729;">${String(booking._id).slice(-8).toUpperCase()}</td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Status</td><td><strong>CANCELLED</strong></td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Amount on file</td><td>NPR ${grossOnFile.toLocaleString('en-IN')}</td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Refund eligible (${refundPct}%)</td><td style="color:#A2D729; font-weight:700;">NPR ${refundEligible.toLocaleString('en-IN')}</td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Cancellation fee (${forfeitPct}%)</td><td style="color:#ff6b6b; font-weight:700;">NPR ${forfeit.toLocaleString('en-IN')}</td></tr>
            </table>
            <p style="margin-top:18px; font-size:13px; opacity:0.75; line-height:1.6;">${refundEligible > 0 ? `The remaining ${refundPct}% (NPR ${refundEligible.toLocaleString('en-IN')}) is processed within 5–7 business days.` : 'No refund applies under the cancellation policy for this booking — either the trip was within 48 hours or had already started.'} Reply to this email if anything looks wrong.</p>
            <p style="margin-top:24px; font-size:11px; opacity:0.5;">— Yaatri Hub</p>
          </div>
        `;
        const result = await sendMail({ to: userDoc.email, subject, html, text });
        if (!result.delivered) {
          console.warn(`[bookings] cancellation receipt ${booking._id} not delivered: ${result.skipped ? 'SMTP not configured' : result.error}`);
        }
      } catch (mailErr) {
        console.warn(`[bookings] cancellation mailer threw: ${mailErr.message}`);
      }
    });

    res.json(booking);
  } catch (err) {
    console.error('BOOKING_CANCEL_ERROR', err);
    res.status(400).json({ message: err.message || 'Failed to cancel booking' });
  }
});

// PATCH /api/bookings/:id/confirm-payment — traveller marks the booking as paid.
// Transitions pending_payment → escrow_held. Once in escrow, the admin can approve.
router.patch('/:id/confirm-payment', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.user) !== String(req.user._id) && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Only the booker can confirm payment.' });
    }
    if (booking.status !== 'pending_payment' && booking.status !== 'pending') {
      return res.status(400).json({ message: `Cannot confirm payment on a booking in status "${booking.status}".` });
    }
    booking.status = 'escrow_held';
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/bookings/:id/review — owner-only. Allowed once per booking, only when the
// trip has reached 'approved' or 'completed' (you can't review a trip you haven't started).
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the traveler who booked this trip can review it.' });
    }
    if (!['approved', 'completed', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: `Reviews are only accepted after a trip is approved or completed (current: "${booking.status}").` });
    }
    if (booking.review?.rating) {
      return res.status(400).json({ message: 'This booking has already been reviewed.' });
    }
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: 'rating must be a number between 1 and 5.' });
    }
    booking.review = {
      rating: r,
      comment: String(comment || '').slice(0, 1000).trim(),
      submittedAt: new Date(),
    };
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/bookings/:id/guide-review — owner-only, submitted once per booking.
router.post('/:id/guide-review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.user) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the traveler who booked this trip can review it.' });
    if (!['approved', 'completed', 'confirmed'].includes(booking.status))
      return res.status(400).json({ message: 'Reviews are only accepted after a trip is approved or completed.' });
    if (!booking.assignedGuide)
      return res.status(400).json({ message: 'No guide was assigned to this booking.' });
    if (booking.guideReview?.rating)
      return res.status(400).json({ message: 'Guide already reviewed for this booking.' });
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5)
      return res.status(400).json({ message: 'rating must be between 1 and 5.' });
    booking.guideReview = { rating: r, comment: String(comment || '').slice(0, 1000).trim(), submittedAt: new Date() };
    await booking.save();
    res.status(201).json(booking);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST /api/bookings/:id/hotel-review — owner-only, submitted once per booking.
router.post('/:id/hotel-review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.user) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the traveler who booked this trip can review it.' });
    if (!['approved', 'completed', 'confirmed'].includes(booking.status))
      return res.status(400).json({ message: 'Reviews are only accepted after a trip is approved or completed.' });
    if (!booking.assignedHotel)
      return res.status(400).json({ message: 'No hotel was assigned to this booking.' });
    if (booking.hotelReview?.rating)
      return res.status(400).json({ message: 'Hotel already reviewed for this booking.' });
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5)
      return res.status(400).json({ message: 'rating must be between 1 and 5.' });
    booking.hotelReview = { rating: r, comment: String(comment || '').slice(0, 1000).trim(), submittedAt: new Date() };
    await booking.save();
    res.status(201).json(booking);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PATCH /api/bookings/:id/status  — admin moves a booking through the lifecycle.
// Validates the transition: certain hops aren't allowed (e.g. completed → pending).
router.patch('/:id/status', validateAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    // Accept canonical + legacy values. Status guard is lenient on purpose so admin
    // can recover from any state; the lifecycle "happy path" is just a suggestion.
    if (!['pending_payment', 'escrow_held', 'approved', 'in_progress', 'completed', 'cancelled', 'expired', 'pending', 'confirmed'].includes(status)) {
      return res.status(400).json({ message: 'invalid status' });
    }
    const updated = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'booking not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/bookings  — admin list of all bookings.
router.get('/', validateAdmin, async (req, res) => {
  try {
    await sweepCompletedBookings();
    const list = await Booking.find({})
      .populate('destination', 'name region')
      .populate('user', 'username email')
      .populate('assignedGuide', 'username profileData.experience')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Expose the sweep helper as a property on the router so index.js can schedule it
// without circular-import gymnastics. Express ignores non-handler properties.
router.sweepCompletedBookings = sweepCompletedBookings;

module.exports = router;
