const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || "YAATRI_CORE_ENCRYPTION_KEY";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "NO_TOKEN_PROVIDED" });
    
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ error: "USER_NOT_FOUND" });
    
    next();
  } catch (err) {
    res.status(401).json({ error: "AUTH_SESSION_EXPIRED" });
  }
};

const validateAdmin = async (req, res, next) => {
  try {
    // We reuse the protect logic first, then check admin role
    await protect(req, res, () => {
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "ADMIN_PRIVILEGES_REQUIRED" });
      }
      next();
    });
  } catch (err) {
    // Handled by protect
  }
};

module.exports = { protect, validateAdmin };