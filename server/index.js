require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const helmet = require('helmet');

// Fix for Node 17+ and MongoDB Atlas DNS resolution issues on some Windows machines
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5175'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('CORS policy does not allow access from this origin.'), false);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Serve uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/destinations', require('./routes/destinations')); // Note: it looks like destinations.js has the code from your previous update

// Hotels
app.use('/api/hotels', require('./routes/hotelRoutes'));

// Hotel Profile Management
app.use('/api/hotel-profile', require('./routes/hotelProfileRoutes'));

// Guide Profile Management
app.use('/api/guides', require('./routes/guideProfileRoutes'));

// Billing and invoices
app.use('/api/billing', require('./routes/billingRoutes'));

// Blogs
app.use('/api/blogs', require('./routes/blogRoutes'));

// AI Authentic Guide
app.use('/api/ai', require('./routes/aiRoute'));

// Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(PORT, () => console.log(`YAATRI_HUB online at port ${PORT}`));