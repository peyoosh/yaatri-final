const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}
const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.sendError(401, 'AUTH_NO_TOKEN', 'Not authorized, no token');
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.sendError(401, 'AUTH_USER_GONE', 'User no longer exists');
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.sendError(401, 'AUTH_TOKEN_FAILED', 'Not authorized, token failed');
  }
};

const validateAdmin = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.sendError(401, 'AUTH_NO_TOKEN', 'Not authorized, no token');
  }

  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.sendError(401, 'AUTH_USER_GONE', 'User no longer exists');
    }

    if (!req.user.isAdmin) {
      return res.sendError(403, 'AUTH_ADMIN_REQUIRED', 'Not authorized, admin privileges required');
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.sendError(401, 'AUTH_TOKEN_FAILED', 'Not authorized, token failed');
  }
};

module.exports = { protect, validateAdmin };