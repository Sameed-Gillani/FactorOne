const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  getMe,
  changePassword,
  logout,
  unlockAccount,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// ─── Strict Rate Limiter: Login Route Only ─────────────────────────────────────
// 5 requests per 15 minutes per IP.
// This is intentionally much tighter than the global limiter to protect
// against brute-force credential stuffing attacks.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,                      // 5 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests (successful logins too)
  message: {
    success: false,
    message:
      "Too many login attempts from this IP address. Please wait 15 minutes before trying again.",
  },
  handler: (req, res, next, options) => {
    console.warn(
      `[RATE LIMIT] Login limit exceeded — IP: ${req.ip} | Email attempted: ${
        req.body?.email ? req.body.email.replace(/(.{2}).+(@.+)/, "$1***$2") : "unknown"
      }`
    );
    res.status(429).json(options.message);
  },
  // Use a key generator that combines IP + route to avoid collisions
  keyGenerator: (req) => `login:${req.ip}`,
});

// ─── Registration Rate Limiter ────────────────────────────────────────────────
// Slightly more lenient than login but still protects against mass account creation.
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again in an hour.",
  },
  keyGenerator: (req) => `register:${req.ip}`,
});

// ─── Password Reset Rate Limiter ──────────────────────────────────────────────
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again in an hour.",
  },
  keyGenerator: (req) => `pwreset:${req.ip}`,
});

// ─── Public Routes ─────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", registerRateLimiter, register);

// POST /api/auth/login  ← strict 5/15min rate limiter applied HERE ONLY
router.post("/login", loginRateLimiter, login);

// POST /api/auth/logout
router.post("/logout", logout);

// ─── Protected Routes (require valid JWT) ──────────────────────────────────────

// GET /api/auth/me
router.get("/me", protect, getMe);

// PUT /api/auth/change-password
router.put("/change-password", protect, changePassword);

// ─── Admin Routes ──────────────────────────────────────────────────────────────

// PUT /api/auth/unlock/:userId  — admin only
router.put("/unlock/:userId", protect, authorize("admin"), unlockAccount);

module.exports = router;
