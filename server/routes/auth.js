const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Public Auth API Routes
// POST   /register  - Create a new user
// POST   /login     - Authenticate user and return JWT
// GET    /me        - Return current authenticated user profile
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}
const JWT_SECRET = process.env.JWT_SECRET;

// POST: Register User
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, phoneNumber, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.sendError(400, 'AUTH_USER_EXISTS', 'User already exists with that email or username.');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      username, email, phoneNumber, password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User registered successfully." });
  } catch (err) {
    next(err);
  }
});

// POST: Login User
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Flexible login: Find by email, phone, OR username
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phoneNumber: identifier }, { username: identifier }] 
    });
    if (!user) return res.sendError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid credentials. Please check your username and password.');

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.sendError(400, 'AUTH_INVALID_PASSWORD', 'Invalid password.');

    // Generate Token & Remove password from response
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toObject();
    userObj.isAdmin = user.isAdmin; // Manually include the virtual property
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) { next(err); }
});

// GET: /me - Get current user profile
router.get('/me', protect, async (req, res) => {
  if (!req.user) {
    return res.sendError(404, 'AUTH_USER_NOT_FOUND', 'User not found');
  }
  const userObj = req.user.toObject();
  userObj.isAdmin = req.user.isAdmin; // Ensure virtual is included
  res.json(userObj);
});

module.exports = router;