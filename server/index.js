require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["https://yaatri-final.onrender.com", "http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yaatri";
mongoose.connect(MONGO_URI, {
  dbName: 'yaatri'
})
  .then(() => {
    console.log(`YAATRI_DATABASE: CONNECTED TO [${mongoose.connection.name.toUpperCase()}]`);
  })
  .catch(err => console.error("DATABASE_CONNECTION_ERROR:", err));

// --- SAFE ROUTE LOADER ---
// Prevents deployment crashes by ignoring missing route files until you create them.
const safeRoute = (routePath) => {
  try {
    return require(routePath);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn(`[WARNING] Missing route file: ${routePath}. Returning placeholder.`);
      return express.Router();
    }
    throw err;
  }
};

// --- ENDPOINTS ---

// Auth Routes (Modular)
app.use('/api/auth', safeRoute('./routes/auth'));
app.use('/api/users', safeRoute('./routes/userRoutes'));
app.use('/api/admin', safeRoute('./routes/adminRoute'));

// Settings
app.use('/api/settings', safeRoute('./routes/settingsRoutes'));

// Admin Blog Routes
app.use('/api/admin/blogs', safeRoute('./routes/adminBlogRoutes'));

// Destinations
app.use('/api/destinations', safeRoute('./routes/destinationRoutes'));

// Blogs
app.use('/api/blogs', safeRoute('./routes/blogRoutes'));

app.listen(PORT, () => console.log(`YAATRI_HUB online at port ${PORT}`));