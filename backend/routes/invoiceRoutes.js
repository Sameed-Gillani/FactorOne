const express = require("express");
const {
  createInvoice, getMyInvoices, getMarketplace, getInvoiceById,
  approveInvoice, rejectInvoice, fbrCheck, creditCheck, getAllInvoices,
} = require("../controllers/invoiceController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { uploadOptional } = require("../middlewares/uploadMiddleware");

const router = express.Router();
router.use(protect);

// SME routes
router.post("/", authorize("sme"), uploadOptional("invoiceFile"), createInvoice);
router.get("/my", authorize("sme"), getMyInvoices);

// Investor route — marketplace
router.get("/marketplace", authorize("investor"), getMarketplace);

// Admin routes
router.get("/admin/all", authorize("admin"), getAllInvoices);
router.patch("/:id/approve", authorize("admin"), approveInvoice);
router.patch("/:id/reject", authorize("admin"), rejectInvoice);
router.get("/:id/fbr-check", authorize("admin"), fbrCheck);
router.get("/:id/credit-check", authorize("admin"), creditCheck);

// Shared — any authenticated user can view a single invoice
router.get("/:id", getInvoiceById);

module.exports = router;
