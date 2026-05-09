const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  activateUser,
  blockUser,
  getAllInvoices,
  getStats,
} = require("../controllers/adminController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// All routes below require a valid JWT AND admin role
router.use(protect, adminOnly);

// ─────────────────────────────────────────────
// User management
// ─────────────────────────────────────────────

// @route   GET /api/admin/users
// @desc    Get all users with wallet balances populated
router.get("/users", getAllUsers);

// @route   PATCH /api/admin/users/:id/activate
// @desc    Activate a user account and send notification
router.patch("/users/:id/activate", activateUser);

// @route   PATCH /api/admin/users/:id/block
// @desc    Block a user account and send notification
router.patch("/users/:id/block", blockUser);

// ─────────────────────────────────────────────
// Invoice management
// ─────────────────────────────────────────────

// @route   GET /api/admin/invoices
// @desc    Get all invoices with SME details populated
// @query   status, page, limit, sortBy, order
router.get("/invoices", getAllInvoices);

// ─────────────────────────────────────────────
// Platform statistics
// ─────────────────────────────────────────────

// @route   GET /api/admin/stats
// @desc    Get platform-wide statistics
router.get("/stats", getStats);

module.exports = router;
