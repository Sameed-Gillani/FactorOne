const express = require('express');
const { body, param } = require('express-validator');

const { placeInvestment, getMyInvestments } = require('../controllers/investmentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, requireActive } = require('../middlewares/roleMiddleware');

const router = express.Router();

// ── Validation ────────────────────────────────────────────────

const placeInvestmentValidation = [
  body('invoiceId')
    .notEmpty().withMessage('Invoice ID is required')
    .isMongoId().withMessage('Invalid invoice ID format'),

  body('amount')
    .notEmpty().withMessage('Investment amount is required')
    .isFloat({ min: 1000 }).withMessage('Minimum investment amount is PKR 1,000')
    .custom((value) => {
      // Must be a whole number (no sub-rupee investments)
      if (value !== Math.floor(value)) {
        throw new Error('Investment amount must be a whole number (no decimals)');
      }
      return true;
    }),
];

// ── Routes ────────────────────────────────────────────────────

/**
 * @route   POST /api/investments
 * @desc    Investor places an investment on a verified invoice
 * @access  Private — Investor, active account
 */
router.post(
  '/',
  protect,
  authorize('investor'),
  requireActive,
  placeInvestmentValidation,
  placeInvestment
);

/**
 * @route   GET /api/investments/my
 * @desc    Investor fetches their investment portfolio with summary
 * @access  Private — Investor only
 */
router.get(
  '/my',
  protect,
  authorize('investor'),
  getMyInvestments
);

module.exports = router;
