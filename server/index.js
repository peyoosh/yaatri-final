require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "https://yaatri-final.onrender.com",
  credentials: true
}));
app.use(express.json());

// --- USER SCHEMA & MODEL ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  status: { type: String, default: 'Active' },
  bio: { type: String, default: 'New Explorer' },
  joinDate: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- MONGODB CONNECTION ---
// Replace with your actual MongoDB URI string
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yaatri";
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("YAATRI_DATABASE: CONNECTED");
    seedAdmin();
  })
  .catch(err => console.error("DATABASE_CONNECTION_ERROR:", err));

const seedAdmin = async () => {
  try {
    const admin = await User.findOne({ username: 'aaryush_admin' });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await new User({
        username: 'aaryush_admin',
        email: 'admin@yaatri.np',
        phoneNumber: '9841000000',
        password: hashedPassword,
        isAdmin: true
      }).save();
      console.log("SYSTEM_ADMIN_CREATED: User: aaryush_admin | Pwd: admin123");
    }
  } catch (err) { console.error("SEEDING_ERROR:", err); }
};

// --- SECURE ADMIN MIDDLEWARE (SIMULATED) ---
const JWT_SECRET = "YAATRI_CORE_ENCRYPTION_KEY";

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "NOT_AUTHORIZED" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) { res.status(401).json({ error: "INVALID_TOKEN" }); }
};

const validateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "NO_TOKEN_PROVIDED" });

  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded.isAdmin) return res.status(403).json({ error: "ADMIN_PRIVILEGES_REQUIRED" });
    req.user = decoded;
    next();
  });
};

// SYSTEM_SETTINGS_STORAGE
let marqueeTitle = "Top Destinations by Weather";

// USER_DATA_STORE (Mock accounts for tracking)
let users = [
  { id: 1, username: 'aaryush_admin', email: 'admin@yaatri.np', isAdmin: true, joinDate: '2024-01-10' },
  { id: 2, username: 'trekker_88', email: 'user@gmail.com', isAdmin: false, joinDate: '2024-02-15' }
];

// DESTINATION_DATA_STORE
let destinations = [
  { 
    rank: '01', 
    region: 'HIMALAYAN_SECTOR', 
    title: 'Everest Khumbu Node', 
    stats: 'ATMOS: STABLE | -25°C', 
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200',
    description: 'Detailed analysis of coordinate node 01. This sector represents the peak of high-altitude exploration.',
    protocols: [
      { title: 'Adventure on foot', desc: 'Expert-led trekking modules with localized survival data.' },
      { title: 'Living traditions', desc: 'Connect with heritage through neural-mapped cultural immersion.' }
    ]
  },
  { 
    rank: '02', 
    region: 'HILL_SECTOR', 
    title: 'Annapurna Circuit', 
    stats: 'ATMOS: VARIABLE | 10°C', 
    image: 'https://images.unsplash.com/photo-1582234131908-769502909282?w=1200',
    description: 'Calculative exploration of the Annapurna region, optimizing for variable weather node stability.'
  },
  { 
    rank: '03', 
    region: 'TERAI_SECTOR', 
    title: 'Chitwan Lowlands', 
    stats: 'ATMOS: HUMID | 32°C', 
    image: 'https://images.unsplash.com/photo-1582650845100-3057102e3532?w=1200',
    description: 'Tropical sector analysis focusing on biodiversity and low-altitude humidity nodes.'
  },
  { 
    rank: '04', 
    region: 'HIMALAYAN_SECTOR', 
    title: 'Langtang Valley', 
    stats: 'ATMOS: CLEAR | -5°C', 
    image: 'https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?w=1200',
    description: 'Primary research node for Glacial movement and high-altitude flora.'
  }
];

// BLOG_DATA_STORE
let posts = [
  { id: 1, user: 'yaatri_nepal', location: 'KHUMBU_SECTOR', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', likes: 42, caption: 'Topographic scan of the Khumbu sector complete.', status: 'Active' },
  { id: 2, user: 'himalayan_vibe', location: 'LALITPUR_HUB', image: 'https://images.unsplash.com/photo-1582234131908-769502909282?w=800', likes: 128, caption: 'Neural mapping of Newari cultural protocols.', status: 'Active' }
];

// --- ENDPOINTS ---

// Auth Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, phoneNumber, password } = req.body;
  
  if (!username || !email || !phoneNumber || !password) {
    return res.status(400).json({ error: "MISSING_FIELDS", message: "All fields are required." });
  }

  try {
    // Check if user already exists by email, phone, or username
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: "ACCOUNT_EXISTS", message: "Email, Phone, or Username already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, phoneNumber, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("REGISTRATION_CRASH:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "DUPLICATE_KEY", message: "Username, Email, or Phone already in use." });
    }
    res.status(500).json({ error: "REGISTRATION_ERROR", message: err.message });
  }
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or phoneNumber
  try {
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phoneNumber: identifier }] 
    });
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ token, user: userResponse });
  } catch (err) {
    console.error("LOGIN_CRASH:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

// Get Current User (Persistence Check)
app.get('/api/auth/me', protect, (req, res) => {
  res.json(req.user);
});

// Admin Stats
app.get('/api/admin/stats', validateAdmin, async (req, res) => {
  const userCount = await User.countDocuments();
  res.json({
    userCount: userCount,
    activeNodes: destinations.length,
    intelStreams: posts.length
  });
});

// Settings
app.get('/api/settings', (req, res) => res.json({ marqueeTitle }));
app.post('/api/settings', validateAdmin, (req, res) => {
  marqueeTitle = req.body.marqueeTitle;
  res.json({ success: true, marqueeTitle });
});

// Destinations
app.get('/api/destinations', (req, res) => res.json(destinations));
app.get('/api/destinations/:rank', (req, res) => {
  const dest = destinations.find(d => d.rank === req.params.rank);
  res.json(dest || { error: 'Node not found' });
});

app.post('/api/destinations', validateAdmin, (req, res) => {
  const newDest = { ...req.body };
  destinations.push(newDest);
  res.json(newDest);
});

app.put('/api/destinations/:rank', validateAdmin, (req, res) => {
  destinations = destinations.map(d => d.rank === req.params.rank ? { ...d, ...req.body } : d);
  res.json({ success: true });
});

app.delete('/api/destinations/:rank', validateAdmin, (req, res) => {
  destinations = destinations.filter(d => d.rank !== req.params.rank);
  res.json({ success: true });
});

// Posts
app.get('/api/posts', (req, res) => res.json(posts));
app.post('/api/posts', (req, res) => {
  const newPost = { id: Date.now(), ...req.body, likes: 0, status: 'Active' };
  posts = [newPost, ...posts];
  res.json(newPost);
});

app.delete('/api/posts/:id', validateAdmin, (req, res) => {
  posts = posts.filter(p => p.id != req.params.id);
  res.json({ success: true });
});

app.patch('/api/posts/:id/like', (req, res) => {
  posts = posts.map(p => p.id == req.params.id ? { ...p, likes: p.likes + 1 } : p);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`YAATRI_HUB online at port ${PORT}`));