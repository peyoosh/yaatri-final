const mongoose = require('mongoose');

const HotelProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    hotelName: {
      type: String,
      default: ''
    },
    basePrice: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    description: {
      type: String,
      default: ''
    },
    amenities: [{
      type: String
    }],
    destinations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination'
    }],
    totalBookings: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('HotelProfile', HotelProfileSchema);
