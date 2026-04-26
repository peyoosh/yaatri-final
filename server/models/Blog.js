const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
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
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['published', 'reported', 'flagged'],
    default: 'published'
  },
  reportCount: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Blog', blogSchema);