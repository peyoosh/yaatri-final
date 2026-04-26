const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || "YAATRI_CORE_ENCRYPTION_KEY";

// POST: Register User
router.post('/register', async (req, res) => {
  try {
    const { username, email, phoneNumber, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with that email or username." });
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
    res.status(500).json({ error: err.message });
  }
});

// POST: Login User
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Flexible login: Find by email, phone, OR username
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phoneNumber: identifier }, { username: identifier }] 
    });
    if (!user) return res.status(404).json({ error: "User not found. Please check your credentials." });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password." });

    // Generate Token & Remove password from response
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;