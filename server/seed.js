const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Destination = require('./models/Destination');

dotenv.config();

const sampleDestinations = [
  {
    title: "Ghalegaun",
    region: "Lamjung",
    description: "A beautiful homestay village offering pristine Gurung culture.",
    culturalSignificance: "Famous for traditional honey hunting and local hospitality.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa", // Placeholder image
    tags: ["Culture", "Homestay"]
  },
  {
    title: "Upper Mustang",
    region: "Mustang",
    description: "The forbidden kingdom with desert-like landscapes and ancient caves.",
    culturalSignificance: "Home to centuries-old Buddhist monasteries.",
    image: "https://images.unsplash.com/photo-1623492701902-47dc207df5dc",
    tags: ["Adventure", "Heritage"]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Destination.deleteMany({}); // Clears existing data
    await Destination.insertMany(sampleDestinations);
    console.log("✅ Database Seeded Successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
};

seedDB();