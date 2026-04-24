const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  region: { type: String, required: true },
  // Sets a professional Nepal-themed placeholder if the Admin leaves the photo blank
  imageURL: { type: String, default: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800' },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('Destination', destinationSchema);