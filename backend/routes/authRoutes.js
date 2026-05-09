const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// ── Validation rules ─────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&#^()_\-+=]/).withMessage('Password must contain at least one special character'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+92|0092|0)?[3][0-9]{9}$/).withMessage('Please provide a valid Pakistani phone number (e.g. 03001234567)'),

  body('cnic')
    .trim()
    .notEmpty().withMessage('CNIC is required')
    .matches(/^\d{5}-\d{7}-\d{1}$/).withMessage('CNIC must be in the format XXXXX-XXXXXXX-X'),

  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['sme', 'investor']).withMessage('Role must be either sme or investor'),

  // SME-specific
  body('businessName')
    .if(body('role').equals('sme'))
    .trim()
    .notEmpty().withMessage('Business name is required for SME accounts')
    .isLength({ max: 200 }).withMessage('Business name cannot exceed 200 characters'),

  body('ntn')
    .if(body('role').equals('sme'))
    .trim()
    .notEmpty().withMessage('NTN is required for SME accounts')
    .matches(/^\d{7}$/).withMessage('NTN must be a 7-digit number'),

  // Investor-specific
  body('city')
    .if(body('role').equals('investor'))
    .trim()
    .notEmpty().withMessage('City is required for investor accounts')
    .isLength({ max: 100 }).withMessage('City name cannot exceed 100 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Routes ───────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @desc    Register a new SME or Investor account
 * @access  Public
 */
router.post('/register', registerValidation, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and receive JWT token
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private
 */
router.get('/me', protect, getMe);

module.exports = router;
