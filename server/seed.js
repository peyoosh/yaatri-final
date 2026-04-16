const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Destination = require('./models/Destination');
const User = require('./models/User');

dotenv.config();

const sampleUsers = [
  {
    username: 'peyoosh_admin',
    email: 'peyoosh@yaatri.np',
    password: '1234567890',
    phoneNumber: '9841111111',
    role: 'author',
    isAdmin: true,
    bio: 'Core system administrator for Yaatri Hub.'
  }
];

const sampleDestinations = [
  {
    title: "Ghalegaun",
    region: "Lamjung",
    description: "A beautiful homestay village offering pristine Gurung culture.",
    culturalSignificance: "Famous for traditional honey hunting and local hospitality.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa", // Placeholder image
    tags: ["Culture", "Homestay"],
    coordinates: { lat: 28.2195, lng: 84.4168 },
    popularity: 8.8,
    terrain: "Hills"
  },
  {
    title: "Upper Mustang",
    region: "Mustang",
    description: "The forbidden kingdom with desert-like landscapes and ancient caves.",
    culturalSignificance: "Home to centuries-old Buddhist monasteries.",
    image: "https://images.unsplash.com/photo-1623492701902-47dc207df5dc",
    tags: ["Adventure", "Heritage"],
    coordinates: { lat: 28.9985, lng: 83.8473 },
    popularity: 9.4,
    terrain: "Mountain"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Seed Users
    await User.deleteMany({});
    const salt = await bcrypt.genSalt(10);
    for (let user of sampleUsers) {
      user.password = await bcrypt.hash(user.password, salt);
    }
    await User.insertMany(sampleUsers);
    console.log("👤 Users Seeded...");

    // Seed Destinations
    await Destination.deleteMany({}); // Clears existing data
    await Destination.insertMany(sampleDestinations);
    console.log("✅ Database (Users & Destinations) Seeded Successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedDB();