// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = "YAATRI_CORE_ENCRYPTION_KEY";

// --- MIDDLEWARE: RE-REFINED VALIDATE_ADMIN ---
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
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
  }
};

// --- GET: FETCH ALL USERS (MANAGEMENT PANEL) ---
// This resolves the 404 on /api/users
router.get('/', validateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "DATABASE_FETCH_ERROR", message: err.message });
  }
});

// --- DELETE: PURGE USER NODE ---
router.delete('/:id', validateAdmin, async (req, res) => {
  try {
    const userToPurge = await User.findById(req.params.id);
    if (userToPurge.isAdmin) {
      return res.status(403).json({ error: "PROTECTED_NODE", message: "Cannot delete an Admin account." });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "USER_PURGED" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;