require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  // FOOLPROOF CORS: Allows your API to be hit from any frontend deployment URL automatically
  origin: true, 
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// FOOLPROOF PAYLOADS: Increased limit to 50MB to prevent crashes if Base64 images are uploaded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yaatri";
mongoose.connect(MONGO_URI, {
  dbName: 'yaatri'
})
  .then(() => {
    console.log(`YAATRI_DATABASE: CONNECTED TO [${mongoose.connection.name.toUpperCase()}]`);
  })
  .catch(err => console.error("DATABASE_CONNECTION_ERROR:", err));

// --- ENDPOINTS ---

// Auth Routes (Modular)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoute'));

// Settings
app.use('/api/settings', require('./routes/settingsRoutes'));

// Admin Blog Routes
app.use('/api/admin/blogs', require('./routes/adminBlogRoutes'));

// Destinations
app.use('/api/destinations', require('./routes/destinationRoutes'));

// Blogs
app.use('/api/blogs', require('./routes/blogRoutes'));

// AI Authentic Guide
app.use('/api/ai', require('./routes/aiRoute'));

app.listen(PORT, () => console.log(`YAATRI_HUB online at port ${PORT}`));