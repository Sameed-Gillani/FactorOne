const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for the given user document.
 *
 * @param {Object} user  - Mongoose User document (must have _id, role, status)
 * @returns {string}     - Signed JWT string
 */
const generateToken = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    status: user.status,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'factorone-api',
    audience: 'factorone-client',
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Verify a JWT and return the decoded payload.
 * Throws if invalid or expired.
 *
 * @param {string} token
 * @returns {Object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'factorone-api',
    audience: 'factorone-client',
  });
};

module.exports = { generateToken, verifyToken };
