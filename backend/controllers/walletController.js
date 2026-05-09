const { validationResult } = require('express-validator');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// ── Helper ────────────────────────────────────────────────────
const formatValidationErrors = (errors) =>
  errors.array().map((e) => ({ field: e.path, message: e.msg }));

// ─────────────────────────────────────────────────────────────
// @route   GET /api/wallet
// @desc    Get authenticated user's wallet with transaction history
// @access  Private — any authenticated user
// ─────────────────────────────────────────────────────────────
const getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id }).populate(
      'user',
      'name email role'
    );

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    // Fetch paginated transactions from Transaction collection
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const txFilter = { userId: req.user._id };
    if (req.query.type) txFilter.type = req.query.type;
    if (req.query.direction) txFilter.direction = req.query.direction;

    const [transactions, txTotal] = await Promise.all([
      Transaction.find(txFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Transaction.countDocuments(txFilter),
    ]);

    // Spending summary by type
    const txSummary = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: { type: '$type', direction: '$direction' },
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      wallet: {
        id: wallet._id,
        owner: wallet.user,
        balance: wallet.balance,
        frozenBalance: wallet.frozenBalance,
        availableBalance: wallet.availableBalance,
        currency: wallet.currency,
        isActive: wallet.isActive,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
      transactions: {
        pagination: {
          total: txTotal,
          page,
          limit,
          totalPages: Math.ceil(txTotal / limit),
          hasNextPage: page < Math.ceil(txTotal / limit),
          hasPrevPage: page > 1,
        },
        summary: txSummary,
        records: transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/wallet/topup
// @desc    Credit user wallet (simulates bank transfer / manual top-up)
// @access  Private — any authenticated user
// ─────────────────────────────────────────────────────────────
const topUp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const { amount, paymentMethod, description } = req.body;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    if (!wallet.isActive) {
      return res.status(400).json({ success: false, message: 'Wallet is currently inactive.' });
    }

    // Credit wallet
    const previousBalance = wallet.balance;
    wallet.balance = parseFloat((wallet.balance + amount).toFixed(2));
    await wallet.save();

    // Record transaction
    const transaction = await Transaction.record({
      walletId: wallet._id,
      userId: req.user._id,
      type: 'topup',
      amount,
      balanceAfter: wallet.balance,
      description: description || `Wallet top-up via ${paymentMethod || 'bank_transfer'}`,
      direction: 'credit',
      paymentMethod: paymentMethod || 'bank_transfer',
    });

    // Notify user
    await Notification.send({
      recipient: req.user._id,
      title: '💳 Wallet Topped Up',
      message: `PKR ${amount.toLocaleString()} has been added to your wallet. New balance: PKR ${wallet.balance.toLocaleString()}.`,
      type: 'wallet_credited',
      metadata: { amount, previousBalance, newBalance: wallet.balance },
    });

    return res.status(200).json({
      success: true,
      message: `PKR ${amount.toLocaleString()} credited to your wallet successfully.`,
      previousBalance,
      newBalance: wallet.balance,
      availableBalance: wallet.availableBalance,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        direction: transaction.direction,
        balanceAfter: transaction.balanceAfter,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/wallet/withdraw
// @desc    Debit user wallet (withdrawal request)
// @access  Private — any authenticated user
// ─────────────────────────────────────────────────────────────
const withdraw = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const { amount, description, bankAccountDetails } = req.body;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found.' });
    }

    if (!wallet.isActive) {
      return res.status(400).json({ success: false, message: 'Wallet is currently inactive.' });
    }

    // Available = balance minus any frozen amounts
    const available = wallet.availableBalance;

    if (amount > available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available balance. Available: PKR ${available.toLocaleString()}, Requested: PKR ${amount.toLocaleString()}.`,
        availableBalance: available,
        frozenBalance: wallet.frozenBalance,
        totalBalance: wallet.balance,
      });
    }

    // Enforce minimum withdrawal
    const MIN_WITHDRAWAL = 500;
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is PKR ${MIN_WITHDRAWAL.toLocaleString()}.`,
      });
    }

    // Deduct from wallet
    const previousBalance = wallet.balance;
    wallet.balance = parseFloat((wallet.balance - amount).toFixed(2));
    await wallet.save();

    // Record transaction
    const transaction = await Transaction.record({
      walletId: wallet._id,
      userId: req.user._id,
      type: 'withdrawal',
      amount,
      balanceAfter: wallet.balance,
      description: description || 'Withdrawal to bank account',
      direction: 'debit',
      paymentMethod: 'bank_transfer',
    });

    // Notify user
    await Notification.send({
      recipient: req.user._id,
      title: '🏦 Withdrawal Processed',
      message: `PKR ${amount.toLocaleString()} withdrawal has been processed. Remaining balance: PKR ${wallet.balance.toLocaleString()}.${bankAccountDetails?.accountNumber ? ` To account: ****${bankAccountDetails.accountNumber.slice(-4)}.` : ''}`,
      type: 'wallet_debited',
      metadata: { amount, previousBalance, newBalance: wallet.balance },
    });

    return res.status(200).json({
      success: true,
      message: `PKR ${amount.toLocaleString()} withdrawal processed successfully.`,
      previousBalance,
      newBalance: wallet.balance,
      availableBalance: wallet.availableBalance,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        direction: transaction.direction,
        balanceAfter: transaction.balanceAfter,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWallet, topUp, withdraw };
