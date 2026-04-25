const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || "YAATRI_CORE_ENCRYPTION_KEY";

// --- REUSABLE MIDDLEWARE ---
const validateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "NO_TOKEN_PROVIDED" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "ADMIN_PRIVILEGES_REQUIRED" });
    }
    next();
  } catch (err) {
    res.status(401).json({ error: "AUTH_SESSION_EXPIRED" });
  }
};

// --- PUBLIC: FETCH ALL NODES ---
router.get('/', async (req, res) => {
  try {
    const allDestinations = await Destination.find().sort({ popularityScore: -1 });
    res.status(200).json(allDestinations);
  } catch (err) {
    res.status(500).json({ error: "DATA_STREAM_FAILURE" });
  }
});

// --- ADMIN: STORE NEW NODE ---
router.post('/', validateAdmin, async (req, res) => {
  try {
    const newDest = new Destination(req.body);
    const savedDest = await newDest.save();
    res.status(201).json(savedDest);
  } catch (err) {
    res.status(400).json({ error: "NODE_STORAGE_FAILED" });
  }
});

// --- ADMIN: PURGE NODE ---
router.delete('/:id', validateAdmin, async (req, res) => {
  try {
    await Destination.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "NODE_PURGED" });
  } catch (err) {
    res.status(400).json({ error: "PURGE_FAILED" });
  }
});

module.exports = router;