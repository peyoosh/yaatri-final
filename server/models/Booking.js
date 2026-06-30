const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
    // Optional: a specific guide the traveller picked from the destination's assignedGuides list.
    // Populated only when the 'guide' add-on is selected AND the destination has guides linked.
    assignedGuide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', default: null, index: true },
    assignedHotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null, index: true },

    travelers: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true, min: 1 },

    // Calculation matrix snapshot at the time of booking (so historical totals don't drift if base rate changes).
    pricing: {
      baseRate: { type: Number, default: 0 },         // per person / per day
      addOns: { type: [String], default: [] },        // e.g. ["guide","premium-lodging"]
      // Legacy field — kept populated for backwards-compat with existing UI reads.
      addOnTotal: { type: Number, default: 0 },
      // Canonical going forward (spelled per spec).
      addOnsTotal: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      // Two-tier tax structure per the Yaatri invoicing spec (4% state + 12% GST = 16% combined).
      stateTax: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      // Legacy single-tier fields — kept so older booking documents continue to parse cleanly.
      vatPercent: { type: Number, default: 16 },
      vatAmount: { type: Number, default: 0 },
      // Legacy total — kept synced with grossTotal below.
      totalCost: { type: Number, required: true, min: 0 },
      // Marketplace settlement snapshot (NEW per the three-tier spec).
      grossTotal: { type: Number, default: 0 },       // == totalCost; new canonical name
      platformShare: { type: Number, default: 0 },    // 15% of grossTotal
      vendorShare: { type: Number, default: 0 },      // 85% of grossTotal, fanned out to vendors
      currency: { type: String, default: 'NPR' },
    },

    startDate: { type: Date },
    endDate: { type: Date },

    status: {
      type: String,
      // Canonical going forward: 'pending_payment' | 'escrow_held' | 'approved'
      // | 'completed' | 'cancelled'.
      // Legacy 'pending' and 'confirmed' kept valid so existing rows don't break
      // — readers should treat 'pending' ≈ 'pending_payment' and 'confirmed' ≈ 'approved'.
      enum: ['pending_payment', 'escrow_held', 'approved', 'completed', 'cancelled', 'pending', 'confirmed'],
      default: 'pending',
    },

    // Refund snapshot — written on cancellation. grossTotal × 0.80 is refunded to
    // the traveller; the remaining 20% is the structural forfeiture retained by
    // the platform (per the marketplace policy).
    refund: {
      eligibleAmount: { type: Number, default: 0 },   // 80% of grossTotal at the time of cancel
      forfeitedAmount: { type: Number, default: 0 },  // 20% retained by the platform
      processedAt: { type: Date, default: null },
    },

    review: {
      rating:  { type: Number, min: 1, max: 5 },
      comment: { type: String, default: '', maxlength: 1000 },
      submittedAt: { type: Date },
    },
    guideReview: {
      rating:  { type: Number, min: 1, max: 5 },
      comment: { type: String, default: '', maxlength: 1000 },
      submittedAt: { type: Date },
    },
    hotelReview: {
      rating:  { type: Number, min: 1, max: 5 },
      comment: { type: String, default: '', maxlength: 1000 },
      submittedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
