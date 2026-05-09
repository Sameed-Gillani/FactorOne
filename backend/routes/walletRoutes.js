const express = require('express');
const { body } = require('express-validator');

const { getWallet, topUp, withdraw } = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// ── Validation ────────────────────────────────────────────────

const topUpValidation = [
  body('amount')
    .notEmpty().withMessage('Top-up amount is required')
    .isFloat({ min: 100 }).withMessage('Minimum top-up amount is PKR 100')
    .isFloat({ max: 10000000 }).withMessage('Maximum single top-up is PKR 10,000,000')
    .custom((value) => {
      if (value !== Math.floor(value)) {
        throw new Error('Amount must be a whole number');
      }
      return true;
    }),

  body('paymentMethod')
    .optional()
    .isIn(['bank_transfer', 'card', 'manual'])
    .withMessage('Payment method must be bank_transfer, card, or manual'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
];

const withdrawValidation = [
  body('amount')
    .notEmpty().withMessage('Withdrawal amount is required')
    .isFloat({ min: 500 }).withMessage('Minimum withdrawal amount is PKR 500')
    .isFloat({ max: 5000000 }).withMessage('Maximum single withdrawal is PKR 5,000,000')
    .custom((value) => {
      if (value !== Math.floor(value)) {
        throw new Error('Amount must be a whole number');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('bankAccountDetails')
    .optional()
    .isObject().withMessage('Bank account details must be an object'),

  body('bankAccountDetails.accountNumber')
    .optional()
    .trim()
    .isLength({ min: 10, max: 24 }).withMessage('Account number must be between 10 and 24 characters'),

  body('bankAccountDetails.bankName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Bank name cannot exceed 100 characters'),

  body('bankAccountDetails.accountTitle')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Account title cannot exceed 100 characters'),
];

// ── Routes ────────────────────────────────────────────────────

/**
 * @route   GET /api/wallet
 * @desc    Get current user's wallet summary and transaction history
 * @access  Private — any authenticated user
 */
router.get('/', protect, getWallet);

/**
 * @route   POST /api/wallet/topup
 * @desc    Top up wallet balance (simulate bank transfer)
 * @access  Private — any authenticated user
 */
router.post('/topup', protect, topUpValidation, topUp);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Withdraw from wallet (checks available balance, excludes frozen)
 * @access  Private — any authenticated user
 */
router.post('/withdraw', protect, withdrawValidation, withdraw);

module.exports = router;
