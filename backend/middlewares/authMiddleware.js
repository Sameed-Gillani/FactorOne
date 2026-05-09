const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');

/**
 * protect
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches the full user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header OR cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify and decode
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Session expired. Please log in again.'
          : 'Invalid token. Please log in again.';
      return res.status(401).json({ success: false, message });
    }

    // Fetch fresh user (ensures status/role changes are honoured in real time)
    const user = await User.findById(decoded.id).select('-password -loginAttempts -lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }

    // Reject blocked accounts immediately
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * optionalProtect
 * Same as protect but does NOT block the request if no token is present.
 * Useful for routes that have both public and authenticated behaviours.
 */
const optionalProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return next(); // Continue unauthenticated

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('-password -loginAttempts -lockUntil');
      if (user && user.status !== 'blocked') {
        req.user = user;
      }
    } catch {
      // Silently ignore invalid tokens in optional mode
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, optionalProtect };
