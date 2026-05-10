const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  activateUser,
  blockUser,
  getAllInvoices,
  getStats,
} = require("../controllers/adminController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.use(protect, authorize('admin'));

router.get("/users", getAllUsers);
router.patch("/users/:id/activate", activateUser);
router.patch("/users/:id/block", blockUser);
router.get("/invoices", getAllInvoices);
router.get("/stats", getStats);

module.exports = router;