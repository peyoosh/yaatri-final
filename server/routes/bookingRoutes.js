const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Destination = require('../models/Destination');
const User = require('../models/User');
const { protect, validateAdmin } = require('../middleware/authMiddleware');
const { sendMail } = require('../utils/mailer');
const { buildBookingInvoiceHTML, buildBookingInvoiceText } = require('../utils/invoiceTemplate');

// Tax tiers per the Yaatri invoicing spec.
const STATE_TAX_RATE = 0.04;  // 4%
const GST_RATE = 0.12;        // 12% — local VAT

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
    } = req.body || {};

    if (!destination) return res.status(400).json({ message: 'destination is required' });
    const dest = await Destination.findById(destination);
    if (!dest) return res.status(400).json({ message: 'Selected destination does not exist' });

    const t = Number(travelers);
    const d = Number(durationDays);
    if (!Number.isFinite(t) || t < 1) return res.status(400).json({ message: 'travelers must be >= 1' });
    if (!Number.isFinite(d) || d < 1) return res.status(400).json({ message: 'durationDays must be >= 1' });

    // Use the client baseRate if provided, otherwise fall back to a sensible default.
    // (No destination.basePrice field exists on the Destination schema today — keep a default tier.)
    const safeBase = Number.isFinite(Number(baseRate)) && Number(baseRate) > 0 ? Number(baseRate) : 2500;

    // Add-on multipliers — each toggled add-on adds a flat fee per traveler per day.
    const addOnRates = { guide: 1500, 'premium-lodging': 2000, transport: 800, meals: 600 };
    const addOnList = Array.isArray(addOns) ? addOns.filter(a => addOnRates[a]) : [];
    const addOnPerPersonPerDay = addOnList.reduce((sum, a) => sum + addOnRates[a], 0);

    const subtotal = safeBase * t * d;
    const addOnTotal = addOnPerPersonPerDay * t * d;
    const beforeTax = subtotal + addOnTotal;
    const stateTax = Math.round(beforeTax * STATE_TAX_RATE);
    const gst = Math.round(beforeTax * GST_RATE);
    const vatAmount = stateTax + gst; // kept populated for backward compatibility with legacy UI reads
    const totalCost = beforeTax + stateTax + gst;

    const booking = await Booking.create({
      user: req.user._id,
      destination,
      travelers: t,
      durationDays: d,
      pricing: {
        baseRate: safeBase,
        addOns: addOnList,
        addOnTotal,
        subtotal,
        stateTax,
        gst,
        vatPercent: 16,
        vatAmount,
        totalCost,
        currency: 'NPR',
      },
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'pending',
    });

    const populated = await Booking.findById(booking._id).populate('destination', 'name region imageURL');

    // Fire-and-forget invoice email — must NEVER block or fail the booking response.
    // The mailer itself gracefully skips when SMTP_HOST is not configured.
    setImmediate(async () => {
      try {
        const userDoc = await User.findById(req.user._id).select('username email');
        if (!userDoc?.email) {
          console.warn(`[bookings] no email on file for user ${req.user._id} — skipping invoice send`);
          return;
        }
        const html = buildBookingInvoiceHTML({ booking: populated.toObject(), user: userDoc.toObject(), destination: populated.destination });
        const text = buildBookingInvoiceText({ booking: populated.toObject(), user: userDoc.toObject(), destination: populated.destination });
        const subject = `Your Yaatri booking is confirmed — ${populated.destination?.name || 'trip'} (NPR ${totalCost.toLocaleString('en-IN')})`;
        await sendMail({ to: userDoc.email, subject, html, text });
      } catch (mailErr) {
        console.error('[bookings] invoice email error (non-fatal):', mailErr.message);
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
    const list = await Booking.find({ user: req.user._id })
      .populate('destination', 'name region imageURL')
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

    booking.status = 'cancelled';
    await booking.save();

    // Fire-and-forget cancellation receipt — never block or fail the response.
    setImmediate(async () => {
      try {
        const userDoc = await User.findById(booking.user).select('username email');
        if (!userDoc?.email) {
          console.warn(`[bookings] cancellation: no email for user ${booking.user} — receipt skipped`);
          return;
        }
        const destName = booking.destination?.name || 'your trip';
        const refunded = Number(booking.pricing?.totalCost || 0);
        const subject = `Your Yaatri booking has been cancelled — ${destName}`;
        const text = [
          `Hi ${userDoc.username || 'traveller'},`,
          '',
          `We've cancelled your booking for ${destName}.`,
          '',
          `Booking ref:  ${String(booking._id).slice(-8).toUpperCase()}`,
          `Status:       CANCELLED`,
          `Amount:       NPR ${refunded.toLocaleString('en-IN')}`,
          '',
          'Refunds (where applicable) are processed within 5–7 business days.',
          'Reply to this email if anything looks wrong.',
          '',
          '— Yaatri Hub',
        ].join('\n');
        const html = `
          <div style="font-family: 'Segoe UI', sans-serif; background:#0D0A02; color:#F4F2F3; padding:24px; max-width:560px; margin:0 auto; border:1px solid #2A3A3F; border-radius:10px;">
            <p style="margin:0 0 8px; font-size:12px; letter-spacing:3px; color:#A2D729; font-weight:800;">YAATRI · BOOKING CANCELLED</p>
            <h2 style="margin:0 0 16px; font-size:22px;">Trip to ${destName} cancelled</h2>
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:13px;">
              <tr><td style="opacity:0.6; padding:4px 0; width:120px;">Booking ref</td><td style="font-family:monospace; color:#A2D729;">${String(booking._id).slice(-8).toUpperCase()}</td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Status</td><td><strong>CANCELLED</strong></td></tr>
              <tr><td style="opacity:0.6; padding:4px 0;">Amount on file</td><td style="color:#A2D729; font-weight:700;">NPR ${refunded.toLocaleString('en-IN')}</td></tr>
            </table>
            <p style="margin-top:18px; font-size:13px; opacity:0.75; line-height:1.6;">Refunds, where applicable, are processed within 5–7 business days. If anything looks wrong, just reply to this email.</p>
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

// PATCH /api/bookings/:id/status  — admin can move a booking through its lifecycle.
router.patch('/:id/status', validateAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
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
    const list = await Booking.find({})
      .populate('destination', 'name region')
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
