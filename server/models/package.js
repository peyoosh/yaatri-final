const packageSchema = new mongoose.Schema({
    title: String,
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
    price: Number,
    duration: String, // e.g., "5 Days"
    itinerary: [{ day: Number, activity: String }],
    isVerified: { type: Boolean, default: false } // For "verified local packages"
});