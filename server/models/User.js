const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    // Canonical going forward: 'user' | 'guide' | 'hotel' | 'support' | 'admin'.
    // Legacy values (explorer, hotel_owner) retained for backwards-compat with
    // older rows — see scripts/migrateLegacyRoles.js for the safe cutover.
    enum: ['user', 'guide', 'hotel', 'support', 'admin', 'explorer', 'hotel_owner'],
    default: 'user'
  },
  isAdmin: { type: Boolean, default: false },
  status: { type: String, default: 'Active' },
  bio: { type: String, default: 'New Explorer' },
  // Base64 data URL of the compressed avatar — heavy field, excluded from default selects.
  // Read paths that need it must opt in via `.select('+avatar')`.
  avatar: { type: String, default: '', select: false },
  profileData: {
    // Shared
    experience: { type: String, default: '' },
    bio: { type: String, default: '' },
    // Hotel
    hotelName: { type: String, default: '' },
    amenities: [{ type: String }],
    baseRoomRate: { type: Number, default: 0 },
    // Guide
    languages: [{ type: String }],
    ratePerDay: { type: Number, default: 0 },
    licenseNumber: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    // Traveler
    favoriteDestinations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }]
  },
  preferences: { type: String, default: 'Adventure, Nature' },

  // Marketplace finance ledger — only meaningful for vendor roles (guide, hotel).
  // Bookings credit `totalEarned` / `pendingPayout` at 85% of grossTotal share.
  // Admin payout flow drains `pendingPayout` and increases `totalWithdrawn`.
  vendorLedger: {
    totalEarned: { type: Number, default: 0 },      // historical gross attribution
    totalWithdrawn: { type: Number, default: 0 },   // sum of admin-issued payouts
    pendingPayout: { type: Number, default: 0 },    // current debt owed to the vendor
  },
  pricePerNight: { type: Number, default: null },
  dailyFee: { type: Number, default: null },
  tripHistory: [
    {
      id: { type: String },
      date: { type: String },
      dest: { type: String },
      hotel: { type: String },
      status: { type: String, default: 'Completed' },
      rating: { type: Number },
      comment: { type: String }
    }
  ],
  joinDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);