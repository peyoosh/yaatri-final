const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },

    travelers: { type: Number, required: true, min: 1 },
    durationDays: { type: Number, required: true, min: 1 },

    // Calculation matrix snapshot at the time of booking (so historical totals don't drift if base rate changes).
    pricing: {
      baseRate: { type: Number, default: 0 },         // per person / per day
      addOns: { type: [String], default: [] },        // e.g. ["guide","premium-lodging"]
      addOnTotal: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      // Two-tier tax structure per the Yaatri invoicing spec (4% state + 12% GST = 16% combined).
      stateTax: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      // Legacy single-tier fields — kept so older booking documents continue to parse cleanly.
      vatPercent: { type: Number, default: 16 },
      vatAmount: { type: Number, default: 0 },
      totalCost: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'NPR' },
    },

    startDate: { type: Date },
    endDate: { type: Date },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
