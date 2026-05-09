const express = require('express');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  submitInvoice,
  getMyInvoices,
  getAllVerified,
  getById,
  approveInvoice,
  rejectInvoice,
  fbrCheck,
  creditCheck,
  getAllInvoicesAdmin,
} = require('../controllers/invoiceController');

const { protect } = require('../middlewares/authMiddleware');
const { authorize, requireActive } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ── Multer config: store invoices in uploads/invoices/ ────────
const uploadDir = path.join(__dirname, '..', 'uploads', 'invoices');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

// ── Validation schemas ────────────────────────────────────────

const submitValidation = [
  body('anchorCompany')
    .trim()
    .notEmpty().withMessage('Anchor company name is required')
    .isLength({ max: 200 }).withMessage('Anchor company name cannot exceed 200 characters'),

  body('amountPkr')
    .notEmpty().withMessage('Invoice amount is required')
    .isFloat({ min: 50000 }).withMessage('Minimum invoice amount is PKR 50,000'),

  body('issueDate')
    .notEmpty().withMessage('Issue date is required')
    .isISO8601().withMessage('Issue date must be a valid date (YYYY-MM-DD)'),

  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Due date must be a valid date (YYYY-MM-DD)')
    .custom((dueDate, { req }) => {
      const issue = new Date(req.body.issueDate);
      const due = new Date(dueDate);
      const minDue = new Date(issue);
      minDue.setDate(minDue.getDate() + 30);
      if (due < minDue) {
        throw new Error('Due date must be at least 30 days after the issue date');
      }
      return true;
    }),

  body('ntn')
    .trim()
    .notEmpty().withMessage('NTN is required')
    .matches(/^\d{7}$/).withMessage('NTN must be a 7-digit number'),
];

const approveValidation = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),

  body('adminNote')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Admin note cannot exceed 1000 characters'),

  body('discountRate')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Discount rate must be between 0 and 100'),

  body('fundedAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Funded amount cannot be negative'),
];

const rejectValidation = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),

  body('adminNote')
    .trim()
    .notEmpty().withMessage('A rejection reason (adminNote) is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Rejection reason must be between 10 and 1000 characters'),
];

const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),
];

// ── Routes ────────────────────────────────────────────────────

/**
 * @route   POST /api/invoices
 * @desc    SME submits a new invoice (supports optional file uploads)
 * @access  Private — SME, active account
 */
router.post(
  '/',
  protect,
  authorize('sme'),
  requireActive,
  upload.array('documents', 5), // up to 5 files per submission
  submitValidation,
  submitInvoice
);

/**
 * @route   GET /api/invoices/my
 * @desc    SME fetches their own invoices
 * @access  Private — SME only
 * NOTE: Must be defined BEFORE /:id to avoid route conflict
 */
router.get(
  '/my',
  protect,
  authorize('sme'),
  getMyInvoices
);

/**
 * @route   GET /api/invoices/admin/all
 * @desc    Admin fetches all invoices with full filter support
 * @access  Private — Admin only
 * NOTE: Must be defined BEFORE /:id to avoid route conflict
 */
router.get(
  '/admin/all',
  protect,
  authorize('admin'),
  getAllInvoicesAdmin
);

/**
 * @route   GET /api/invoices
 * @desc    Investor fetches all verified invoices available for bidding
 * @access  Private — Investor only
 */
router.get(
  '/',
  protect,
  authorize('investor'),
  requireActive,
  getAllVerified
);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID (role-based visibility rules applied in controller)
 * @access  Private — any authenticated user
 */
router.get(
  '/:id',
  protect,
  mongoIdParam,
  getById
);

/**
 * @route   PATCH /api/invoices/:id/approve
 * @desc    Admin approves a pending invoice
 * @access  Private — Admin only
 */
router.patch(
  '/:id/approve',
  protect,
  authorize('admin'),
  approveValidation,
  approveInvoice
);

/**
 * @route   PATCH /api/invoices/:id/reject
 * @desc    Admin rejects a pending or verified invoice (mandatory reason)
 * @access  Private — Admin only
 */
router.patch(
  '/:id/reject',
  protect,
  authorize('admin'),
  rejectValidation,
  rejectInvoice
);

/**
 * @route   GET /api/invoices/:id/fbr-check
 * @desc    Admin verifies invoice NTN against Mock FBR database
 * @access  Private — Admin only
 */
router.get(
  '/:id/fbr-check',
  protect,
  authorize('admin'),
  mongoIdParam,
  fbrCheck
);

/**
 * @route   GET /api/invoices/:id/credit-check
 * @desc    Admin checks anchor company credit score via Mock Credit database
 * @access  Private — Admin only
 */
router.get(
  '/:id/credit-check',
  protect,
  authorize('admin'),
  mongoIdParam,
  creditCheck
);

module.exports = router;
