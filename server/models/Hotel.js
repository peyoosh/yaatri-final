const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    totalRooms: {
      type: Number,
      default: 10 // Default for user-owned hotels
    },
    bookedRooms: {
      type: Number,
      default: 0
    },
    basePrice: {
      type: Number,
      required: true
    },
    features: [{
      type: String
    }],
    phoneNumber: {
      type: String
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true // Allow null values, but unique when present
    },
    isUserOwned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

HotelSchema.virtual('isFull').get(function() {
  return this.bookedRooms >= this.totalRooms;
});

// Ensure virtuals are included in JSON/Object conversions
HotelSchema.set('toJSON', { virtuals: true });
HotelSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Hotel', HotelSchema);
