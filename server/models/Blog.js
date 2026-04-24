const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  locationNode: { type: String },
  timestamp: { type: Date, default: Date.now },
  images: [{ type: String }],
  reportCount: { type: Number, default: 0 },
  status: { type: String, enum: ['published', 'reported', 'flagged'], default: 'published' }
});

module.exports = mongoose.model('Blog', blogSchema);