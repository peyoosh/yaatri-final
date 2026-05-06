const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['explorer', 'hotel_owner', 'guide', 'admin'],
    default: 'explorer' 
  },
  isAdmin: { type: Boolean, default: false },
  status: { type: String, default: 'Active' },
  bio: { type: String, default: 'New Explorer' },
  profileData: {
    experience: String,
    amenities: [String],
    bio: String
  },
  preferences: { type: String, default: 'Adventure, Nature' },
  tripHistory: [
    {
      id: { type: String },
      date: { type: String },
      dest: { type: String },
      hotel: { type: String },
      status: { type: String, default: 'Completed' },
      rating: { type: Number },
      comment: { type: String }
    }
  ],
  joinDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);