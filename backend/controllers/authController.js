const { validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/generateToken');

// ── Helper: format validation errors ─────────────────────────
const formatValidationErrors = (errors) =>
  errors.array().map((e) => ({ field: e.path, message: e.msg }));

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user (SME, Investor) & auto-create wallet
// @access  Public
// ─────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // 1. Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const { name, email, password, phone, cnic, role, businessName, ntn, city } = req.body;

    // 2. Prevent duplicate email / cnic
    const existingUser = await User.findOne({ $or: [{ email }, { cnic }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'CNIC';
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists.`,
      });
    }

    // 3. Build user object (only include role-specific fields)
    const userData = { name, email, password, phone, cnic, role };

    if (role === 'sme') {
      userData.businessName = businessName;
      userData.ntn = ntn;
    }

    if (role === 'investor') {
      userData.city = city;
    }

    // 4. Create user (password hashed via pre-save hook)
    const user = await User.create(userData);

    // 5. Auto-create wallet for new user
    await Wallet.create({ user: user._id });

    // 6. Send welcome notification
    await Notification.send({
      recipient: user._id,
      title: 'Welcome to FactorOne!',
      message: `Hi ${user.name}, your account has been created and is pending admin review. You will be notified once approved.`,
      type: 'account_approved',
    });

    // 7. Generate token
    const token = generateToken(user);

    // 8. Return sanitised user data
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Awaiting admin approval.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cnic: user.cnic,
        role: user.role,
        status: user.status,
        ...(role === 'sme' && { businessName: user.businessName, ntn: user.ntn }),
        ...(role === 'investor' && { city: user.city }),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Authenticate user & return JWT (with lockout after 5 fails)
// @access  Public
// ─────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    // 1. Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const { email, password } = req.body;

    // 2. Find user (include password + lockout fields for this check only)
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      // Generic message to avoid user enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Check if account is currently locked
    if (user.isLocked) {
      const remainingMs = user.lockUntil - Date.now();
      const remainingMins = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to too many failed attempts. Try again in ${remainingMins} minute(s).`,
        lockedUntil: user.lockUntil,
      });
    }

    // 4. Check if account is blocked by admin
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    // 5. Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Increment failed attempts (may trigger lockout)
      await user.incLoginAttempts();

      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;
      const attemptsAfter = user.loginAttempts + 1;
      const remaining = maxAttempts - attemptsAfter;

      if (remaining <= 0) {
        const lockMins = parseInt(process.env.LOCK_TIME_MINUTES, 10) || 30;
        return res.status(423).json({
          success: false,
          message: `Too many failed attempts. Account locked for ${lockMins} minute(s).`,
        });
      }

      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${remaining} attempt(s) remaining before lockout.`,
      });
    }

    // 6. Successful login — reset counter
    await user.resetLoginAttempts();

    // 7. Generate token
    const token = generateToken(user);

    // 8. Fetch wallet balance for convenience
    const wallet = await Wallet.findOne({ user: user._id }).select('balance frozenBalance currency');

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cnic: user.cnic,
        role: user.role,
        status: user.status,
        ...(user.role === 'sme' && { businessName: user.businessName, ntn: user.ntn }),
        ...(user.role === 'investor' && { city: user.city }),
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      wallet: wallet
        ? {
            balance: wallet.balance,
            frozenBalance: wallet.frozenBalance,
            availableBalance: wallet.availableBalance,
            currency: wallet.currency,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get currently authenticated user's profile
// @access  Private (requires valid JWT)
// ─────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware (no password field)
    const user = req.user;

    // Also return wallet summary
    const wallet = await Wallet.findOne({ user: user._id }).select('balance frozenBalance currency');

    // Unread notification count
    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        cnic: user.cnic,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture,
        ...(user.role === 'sme' && { businessName: user.businessName, ntn: user.ntn }),
        ...(user.role === 'investor' && { city: user.city }),
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      wallet: wallet
        ? {
            balance: wallet.balance,
            frozenBalance: wallet.frozenBalance,
            availableBalance: wallet.availableBalance,
            currency: wallet.currency,
          }
        : null,
      unreadNotifications: unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
