const mongoose = require('mongoose');

const GuideSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    guideName: {
      type: String,
      default: ''
    },
    dailyFee: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    bio: {
      type: String,
      default: ''
    },
    expertise: [{
      type: String
    }],
    isVerified: {
      type: Boolean,
      default: false
    },
    destinations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Destination'
    }],
    completedTours: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Guide', GuideSchema);
