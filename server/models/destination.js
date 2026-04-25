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
    }
  },
  {
    timestamps: true,
    collection: 'destinations' // Explicitly linking to the 'destinations' collection
  }
);

module.exports = mongoose.model('Destination', DestinationSchema);