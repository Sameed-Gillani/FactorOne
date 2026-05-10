const express = require("express");
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
} = require("../controllers/invoiceController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { uploadSingle, uploadOptional } = require("../middlewares/uploadMiddleware");

const router = express.Router();

// All invoice routes require authentication
router.use(protect);

// ─── POST /api/invoices ───────────────────────────────────────────────────────
// Create a new invoice. Accepts an optional "invoiceFile" field (jpg/png/pdf, max 5MB).
// uploadSingle runs the full pipeline:
//   multer parse → file required check → magic bytes validate → attach req.uploadedFile
router.post(
  "/",
  authorize("admin", "borrower"),
  uploadSingle("invoiceFile"),
  createInvoice
);

// ─── GET /api/invoices ────────────────────────────────────────────────────────
router.get("/", getAllInvoices);

// ─── GET /api/invoices/:id ────────────────────────────────────────────────────
router.get("/:id", getInvoiceById);

// ─── PUT /api/invoices/:id ────────────────────────────────────────────────────
// Full update. File is optional (uploadOptional won't 400 if no file sent).
router.put(
  "/:id",
  authorize("admin", "borrower"),
  uploadOptional("invoiceFile"),
  updateInvoice
);

// ─── PATCH /api/invoices/:id/status ──────────────────────────────────────────
router.patch("/:id/status", authorize("admin"), updateInvoiceStatus);

// ─── DELETE /api/invoices/:id ─────────────────────────────────────────────────
router.delete("/:id", authorize("admin", "borrower"), deleteInvoice);

module.exports = router;
