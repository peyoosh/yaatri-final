require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["https://yaatri-final.onrender.com", "http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- USER SCHEMA & MODEL ---
const User = require('./models/User');
const Destination = require('./models/Destination');
const Blog = require('./models/Blog');

// --- MONGODB CONNECTION ---
// Replace with your actual MongoDB URI string
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yaatri";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'yaatri'
})
  .then(() => {
    console.log(`YAATRI_DATABASE: CONNECTED TO [${mongoose.connection.name.toUpperCase()}]`);
    seedAdmin();
  })
  .catch(err => console.error("DATABASE_CONNECTION_ERROR:", err));

const seedAdmin = async () => {
  try {
    const admins = [
      { username: 'peyoosh_admin', email: 'peyoosh@yaatri.np', phoneNumber: '9841111111' }
    ];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('1234567890', salt);

    for (const adminData of admins) {
      const exists = await User.findOne({ username: adminData.username });
      if (!exists) {
        await new User({
          ...adminData,
          password: hashedPassword,
          role: 'author',
          isAdmin: true
        }).save();
        console.log(`SYSTEM_ADMIN_CREATED: User: ${adminData.username} | Pwd: 1234567890`);
      } else {
        exists.password = hashedPassword;
        exists.isAdmin = true;
        await exists.save();
        console.log(`SYSTEM_ADMIN_UPDATED: User: ${adminData.username} | New Pwd applied.`);
      }
    }
  } catch (err) { console.error("SEEDING_ERROR:", err); }
};

// --- SECURE ADMIN MIDDLEWARE (SIMULATED) ---
const JWT_SECRET = process.env.JWT_SECRET || "YAATRI_CORE_ENCRYPTION_KEY";

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "NOT_AUTHORIZED" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) { res.status(401).json({ error: "INVALID_TOKEN" }); }
};

const validateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "NO_TOKEN_PROVIDED" });

  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.isAdmin !== true) {
      return res.status(403).json({ error: "ADMIN_PRIVILEGES_REQUIRED" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
};

// SYSTEM_SETTINGS_STORAGE
let marqueeTitle = "Top Destinations by Weather";

// --- ENDPOINTS ---

// Auth Routes (Modular)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
const adminRoutes = require('./routes/adminRoute');
app.use('/api/admin', adminRoutes);

// Get Current User (Persistence Check)
app.get('/api/auth/me', protect, (req, res) => {
  res.json(req.user);
});

// Settings
app.get('/api/settings', (req, res) => res.json({ marqueeTitle }));
app.post('/api/settings', validateAdmin, (req, res) => {
  marqueeTitle = req.body.marqueeTitle;
  res.json({ success: true, marqueeTitle });
});

// Admin: Fetch all blogs (published, reported, flagged) for Management Panel
app.get('/api/admin/blogs', validateAdmin, async (req, res) => {
  try {
    // Populates the authorId field with the author's actual username and email
    const allBlogs = await Blog.find()
      .populate('authorId', 'username email')
      .sort({ timestamp: -1 });
    res.json(allBlogs || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Destinations
app.use('/api/destinations', require('./routes/destinationRoutes'));

// Blogs
app.get('/api/blogs', async (req, res) => {
  try {
    // Ensures empty array [] is returned if none are found
    const publishedBlogs = await Blog.find({ status: 'published' })
      .populate('authorId', 'username') // Safely fetches only the username for public display
      .sort({ timestamp: -1 });
    res.json(publishedBlogs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/blogs', protect, async (req, res) => {
  try {
    const { title, content, images, locationNode } = req.body;
    const newBlog = new Blog({
      title,
      content,
      authorId: req.user._id, // Gathered securely from the token parsing in 'protect'
      locationNode,
      images,
      status: 'published'
    }); // Timestamp defaults to Date.now in schema
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/blogs/:id/report', protect, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    blog.reportCount += 1;
    
    if (blog.reportCount > 5) {
      blog.status = 'flagged';
    } else if (blog.status === 'published') {
      blog.status = 'reported';
    }
    
    await blog.save();
    res.json({ success: true, message: 'Blog reported successfully' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.patch('/api/admin/blogs/:id/flag', validateAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id, 
      { status: 'flagged' }, 
      { new: true }
    );
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/blogs/:id', validateAdmin, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`YAATRI_HUB online at port ${PORT}`));