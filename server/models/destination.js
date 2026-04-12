const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  title: String,
  region: String,
  description: String,
  category: String,
  image: String
}, { timestamps: true });

module.exports = mongoose.model('Destination', destinationSchema);