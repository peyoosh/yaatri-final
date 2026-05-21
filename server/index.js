require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const helmet = require('helmet');

// Fix for Node 17+ and MongoDB Atlas DNS resolution issues on some Windows machines
dns.setDefaultResultOrder('ipv4first');

const app = express();

// Be tolerant of malformed PORT values in .env — accept "5000", "0.0.0.0:5000", ":5000", "localhost:5000".
// `app.listen()` already takes the host separately, so we strip any leading host part here.
const parsePortEnv = (raw) => {
  if (raw === undefined || raw === null || raw === '') return 5000;
  const str = String(raw).trim();
  const numericMatch = str.match(/(\d{2,5})\s*$/);
  if (numericMatch) {
    const n = Number(numericMatch[1]);
    if (n >= 1 && n <= 65535) return n;
  }
  console.warn(`[boot] PORT env value "${raw}" is malformed — falling back to 5000.`);
  return 5000;
};
const PORT = parsePortEnv(process.env.PORT);

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'https://yaatri-final.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('CORS policy does not allow access from this origin.'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204,
  preflightContinue: false,
}));
// 50mb to accommodate Base64-encoded compressed images stored directly in MongoDB documents.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Attach a unified response helper to every request.
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);

  const deriveErrorCode = (statusCode, path) => {
    const routeKey = path
      .replace(/\W+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase() || 'UNKNOWN';

    if (statusCode >= 500) return `${routeKey}_SERVER_ERROR`;
    if (statusCode === 404) return `${routeKey}_NOT_FOUND`;
    if (statusCode === 401 || statusCode === 403) return `${routeKey}_AUTH_ERROR`;
    if (statusCode === 400) return `${routeKey}_CLIENT_ERROR`;
    return `${routeKey}_ERROR`;
  };

  res.sendError = (statusCode, errorCode, message, details) => {
    const payload = {
      error: message || 'An error occurred',
      errorCode: errorCode || deriveErrorCode(statusCode, req.path),
      errorSource: `${req.method} ${req.path}`,
      details: details || undefined,
    };
    return res.status(statusCode).json(payload);
  };

  res.json = (body) => {
    if (body && typeof body === 'object' && body.error && !body.errorCode) {
      body = {
        ...body,
        errorCode: deriveErrorCode(res.statusCode || 500, req.path),
        errorSource: `${req.method} ${req.path}`,
      };
    }
    return originalJson(body);
  };

  next();
});

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

// --- HEALTH CHECK ---
// Used by the frontend interceptor to detect when the backend is back online after a transient outage.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: PORT,
    uptime: process.uptime(),
  });
});

// --- ENDPOINTS ---

// Auth Routes (Modular) - mounted under /api for consistency with other endpoints
// POST /api/login     -> authenticate user and return JWT
// POST /api/register  -> register a new user
// GET  /api/me        -> get current authenticated user profile
app.use('/api', require('./routes/auth'));

// Stats Routes
app.use('/api/stats', require('./routes/statsRoutes'));

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`YAATRI_HUB online at 0.0.0.0:${PORT}`);
}).on('error', (err) => {
  console.error('SERVER BOOT CRASH DETECTED:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Free it (e.g. taskkill /F /PID <pid> after  netstat -ano | findstr :${PORT}) and try again.`);
  }
  process.exit(1);
});