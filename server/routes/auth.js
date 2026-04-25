const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || "YAATRI_CORE_ENCRYPTION_KEY";

// Register
router.post('/register', async (req, res) => {
  const { username, email, phoneNumber, password } = req.body;
  if (!username || !email || !phoneNumber || !password) {
    return res.status(400).json({ error: "MISSING_FIELDS", message: "All fields are required." });
  }
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "ACCOUNT_EXISTS", message: "Email, Phone, or Username already registered." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, email, phoneNumber, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ success: true, message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ error: "REGISTRATION_ERROR", message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { identifier, email, username, password } = req.body;
  const loginId = identifier || email || username;
  try {
    const user = await User.findOne({ $or: [{ email: loginId }, { phoneNumber: loginId }, { username: loginId }] });
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ token, user: userResponse });
  } catch (err) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
});

module.exports = router;