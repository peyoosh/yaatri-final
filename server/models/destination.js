const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  title: String,
  region: String,
  description: String,
  category: String,
  image: String,
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  popularity: { type: Number },
  terrain: { type: String, enum: ['Mountain', 'Hills', 'Terai'], default: 'Mountain' },
  status: { type: String, enum: ['Active', 'Maintenance'], default: 'Active' },
  culturalSignificance: String,
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Destination', destinationSchema);