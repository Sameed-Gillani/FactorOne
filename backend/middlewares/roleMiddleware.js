/**
 * authorize(...roles)
 *
 * Factory that returns a middleware restricting access to the listed roles.
 * Must be used AFTER the protect middleware (req.user must exist).
 *
 * Usage:
 *   router.get('/admin-only', protect, authorize('admin'), handler)
 *   router.get('/sme-or-admin', protect, authorize('sme', 'admin'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

/**
 * requireActive
 *
 * Middleware that blocks users whose account status is not 'active'.
 * Useful for routes that require full KYC/approval before access.
 * Must be used AFTER protect.
 */
const requireActive = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  if (req.user.status !== 'active') {
    return res.status(403).json({
      success: false,
      message:
        req.user.status === 'pending'
          ? 'Your account is pending approval. Please wait for admin verification.'
          : 'Your account is not active. Please contact support.',
    });
  }

  next();
};

module.exports = { authorize, requireActive };
