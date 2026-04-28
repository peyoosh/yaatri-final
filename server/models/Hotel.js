const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    totalRooms: {
      type: Number,
      required: true
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
