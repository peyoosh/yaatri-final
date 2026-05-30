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
    // BSON-ceiling audit (Phase 2 schema review): imageURL stores short CDN URLs
    // (Unsplash, R2, etc.), not Base64 strings — so it is intentionally NOT marked
    // `select: false`. If you ever switch destinations to store inline Base64
    // imagery, add `select: false` here and opt back in via .select('+imageURL')
    // on the destination list / detail routes that render the asset directly.
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
    },
    totalVisits: { 
      type: Number, 
      default: 0 
    },
    assignedHotels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
    assignedGuides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Micro-itineraries / attractions adjacent to the destination. Admin-managed
    // via the destination editor. Used by the booking flow to surface paid extras.
    activities: [{
      title:       { type: String, required: true },
      description: { type: String, default: '' },
      baseCostNPR: { type: Number, default: 0 },
      durationHours: { type: Number, default: 1 },
    }]
  },
  {
    timestamps: true,
    collection: 'destinations' // Explicitly linking to the 'destinations' collection
  }
);

// Mongoose 9 removed the `next` callback signature for async hooks — throw to signal errors instead.
DestinationSchema.pre('save', async function () {
  const User = mongoose.model('User');
  const Hotel = mongoose.model('Hotel');

  if (this.isModified('assignedHotels') && this.assignedHotels && this.assignedHotels.length > 0) {
    const hotels = await Hotel.find({ _id: { $in: this.assignedHotels } });
    if (hotels.length !== this.assignedHotels.length) {
      throw new Error('One or more assigned hotels are invalid.');
    }
  }

  if (this.isModified('assignedGuides') && this.assignedGuides && this.assignedGuides.length > 0) {
    const guides = await User.find({ _id: { $in: this.assignedGuides } });
    const invalidGuides = guides.filter(g => g.role !== 'guide');
    if (invalidGuides.length > 0) {
      throw new Error('One or more assigned guides do not have the guide role.');
    }
  }
});

module.exports = mongoose.model('Destination', DestinationSchema);
