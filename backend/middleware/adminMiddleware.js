// ─────────────────────────────────────────────
// adminOnly
// Must run AFTER the `protect` middleware so that req.user is populated.
// Rejects the request if the authenticated user's role is not "admin".
// ─────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorised — user not authenticated",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied — admin privileges required",
    });
  }

  next();
};

module.exports = { adminOnly };
