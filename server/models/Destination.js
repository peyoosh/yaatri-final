const mongoose = require('mongoose');

const DestinationSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Destination name is required'] 
    },
    region: { 
      type: String, 
      required: [true, 'Region is required'] 
    },
    description: { 
      type: String, 
      required: [true, 'Description is required'] 
    },
    imageURL: { 
      type: String, 
      required: [true, 'Image URL is required'] 
    },
    terrainType: {
      type: String,
      enum: ['Himalayan', 'Hill', 'Terai'],
      default: 'Hill'
    },
    popularityScore: { 
      type: Number, 
      default: 0 
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    altitude: {
      type: Number
    },
    environmentalTips: {
      isViewPoint: { type: Boolean, default: false },
      isNaturalWaterBody: { type: Boolean, default: false }
    },
    experienceProtocols: {
      adventure: { type: String, default: 'Expert-led trekking modules with localized survival data specific to this node.' },
      tradition: { type: String, default: 'Connect with heritage through neural-mapped cultural immersion protocols.' },
      landscape: { type: String, default: 'Dynamic topographic tracking optimized for shifting regional weather nodes.' },
      tours: { type: String, default: 'Structured sector exploration focusing on historical and Newari lineage markers.' }
    }
  },
  {
    timestamps: true,
    collection: 'destinations' // Explicitly linking to the 'destinations' collection
  }
);

module.exports = mongoose.model('Destination', DestinationSchema);
