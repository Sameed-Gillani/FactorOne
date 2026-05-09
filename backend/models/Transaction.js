const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet reference is required'],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    type: {
      type: String,
      enum: {
        values: ['topup', 'investment', 'disbursement', 'withdrawal'],
        message: 'Type must be topup, investment, disbursement, or withdrawal',
      },
      required: [true, 'Transaction type is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Transaction amount must be greater than 0'],
    },

    balanceAfter: {
      type: Number,
      required: [true, 'Balance after transaction is required'],
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: null,
    },

    // Reference to the related document (Invoice, Investment, etc.)
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceModel: {
      type: String,
      enum: ['Invoice', 'Investment', null],
      default: null,
    },

    // Credit or Debit indicator
    direction: {
      type: String,
      enum: {
        values: ['credit', 'debit'],
        message: 'Direction must be credit or debit',
      },
      required: [true, 'Transaction direction is required'],
    },

    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'reversed'],
      default: 'completed',
    },

    // For topup: payment method tracking
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'card', 'manual', 'system'],
      default: 'system',
    },

    // Optional: who initiated if different from userId (e.g., admin)
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Platform fee deducted (for disbursement transactions)
    feeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Static: helper to create a transaction record ────────────
transactionSchema.statics.record = async function ({
  walletId,
  userId,
  type,
  amount,
  balanceAfter,
  description,
  referenceId,
  referenceModel,
  direction,
  paymentMethod,
  initiatedBy,
  feeAmount,
}) {
  return this.create({
    walletId,
    userId,
    type,
    amount,
    balanceAfter,
    description,
    referenceId: referenceId || null,
    referenceModel: referenceModel || null,
    direction,
    status: 'completed',
    paymentMethod: paymentMethod || 'system',
    initiatedBy: initiatedBy || null,
    feeAmount: feeAmount || 0,
  });
};

// ── Indexes ──────────────────────────────────────────────────
transactionSchema.index({ walletId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ referenceId: 1, referenceModel: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
