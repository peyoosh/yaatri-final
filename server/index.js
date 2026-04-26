require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const seedAdmin = require('./utils/seedAdmin');

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
mongoose.connect(process.env.MONGO_URI, {
  dbName: 'yaatri'
})
  .then(() => {
    console.log(`YAATRI_DATABASE: CONNECTED TO [${mongoose.connection.name.toUpperCase()}]`);
    seedAdmin();
  })
  .catch(err => console.error("DATABASE_CONNECTION_ERROR:", err));

// --- ENDPOINTS ---

// Auth Routes (Modular)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/api/auth/me', require('./routes/authMeRoutes'));

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
const adminRoutes = require('./routes/adminRoute');
app.use('/api/admin', adminRoutes);

// Settings
app.use('/api/settings', require('./routes/settingsRoutes'));

// Admin Blog Routes
app.use('/api/admin/blogs', require('./routes/adminBlogRoutes'));

// Destinations
app.use('/api/destinations', require('./routes/destinationRoutes'));

// Blogs
app.use('/api/blogs', require('./routes/blogRoutes'));

app.listen(PORT, () => console.log(`YAATRI_HUB online at port ${PORT}`));