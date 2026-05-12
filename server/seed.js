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
    role: 'admin',
    isAdmin: true,
    bio: 'Core system administrator for Yaatri Hub.'
  }
];

const sampleDestinations = [
  {
    name: "Ghalegaun",
    region: "Lamjung",
    description: "A beautiful homestay village offering pristine Gurung culture. Famous for traditional honey hunting and local hospitality.",
    imageURL: "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
    terrainType: "Hill",
    popularityScore: 88
  },
  {
    name: "Upper Mustang",
    region: "Mustang",
    description: "The forbidden kingdom with desert-like landscapes and ancient caves. Home to centuries-old Buddhist monasteries.",
    imageURL: "https://images.unsplash.com/photo-1623492701902-47dc207df5dc",
    terrainType: "Himalayan",
    popularityScore: 94
  },
  {
    name: "Pokhara",
    region: "Kaski",
    description: "Gateway to the Annapurna region with stunning lakes, mountain views, and adventure activities.",
    imageURL: "https://images.unsplash.com/photo-1605640840605-14ac1855827b",
    terrainType: "Hill",
    popularityScore: 96
  },
  {
    name: "Kathmandu Valley",
    region: "Kathmandu",
    description: "Cultural heart of Nepal with ancient temples, palaces, and vibrant city life.",
    imageURL: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220",
    terrainType: "Hill",
    popularityScore: 92
  },
  {
    name: "Everest Base Camp",
    region: "Solukhumbu",
    description: "The ultimate trekking destination leading to the base of the world's highest mountain.",
    imageURL: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e",
    terrainType: "Himalayan",
    popularityScore: 98
  },
  {
    name: "Chitwan National Park",
    region: "Chitwan",
    description: "Nepal's premier wildlife sanctuary famous for rhinos, tigers, and elephant safaris.",
    imageURL: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
    terrainType: "Terai",
    popularityScore: 89
  },
  {
    name: "Lumbini",
    region: "Rupandehi",
    description: "Birthplace of Lord Buddha, a UNESCO World Heritage site with ancient monasteries.",
    imageURL: "https://images.unsplash.com/photo-1578662996442-48f60103fc96",
    terrainType: "Terai",
    popularityScore: 85
  },
  {
    name: "Annapurna Circuit",
    region: "Manang",
    description: "One of the world's greatest treks through diverse landscapes and cultures.",
    imageURL: "https://images.unsplash.com/photo-1464822759844-d150f39ac1ac",
    terrainType: "Himalayan",
    popularityScore: 97
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