const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: false,
    default: ''
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  locationNode: {
    type: String,
    default: ''
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    default: null
  },
  // Base64 data URL (or URL) for the cover image. Heavy when uploaded as Base64 —
  // excluded from default selects. List/detail endpoints opt in via `.select('+image')`.
  image: {
    type: String,
    required: false,
    default: '',
    select: false,
  },
  imagePublicId: {
    type: String,
    default: ''
  },
  // Same rationale as `image` — array of Base64 strings is the heaviest field on the doc.
  images: { type: [String], default: [], select: false },
  imagesPublicIds: [{
    type: String
  }],
  taggedHotels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  }],
  taggedGuides: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guide'
  }],
  status: {
    type: String,
    enum: ['pending', 'published', 'reported', 'flagged'],
    default: 'pending'
  },
  reportCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Blog', blogSchema);