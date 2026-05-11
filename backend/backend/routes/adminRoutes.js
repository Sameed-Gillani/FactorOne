const express = require("express");
const router  = express.Router();
const { protect }   = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { getAllUsers, activateUser, blockUser, getAllInvoices, getStats } = require("../controllers/adminController");

const adminOnly = [protect, authorize("admin")];

router.get("/users",                adminOnly, getAllUsers);
router.patch("/users/:id/activate", adminOnly, activateUser);
router.patch("/users/:id/block",    adminOnly, blockUser);
router.get("/invoices",             adminOnly, getAllInvoices);
router.get("/stats",                adminOnly, getStats);

module.exports = router;
