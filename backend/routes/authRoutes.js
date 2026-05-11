const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, getMe, changePassword, logout, forgotPassword, resetPassword } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: "Too many login attempts. Please wait 15 minutes." },
  keyGenerator: (req) => `login:${req.ip}`,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { success: false, message: "Too many registrations. Please try again in an hour." },
});

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
