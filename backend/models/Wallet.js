const mongoose = require('mongoose');

// ── Transaction sub-document ─────────────────────────────────
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Transaction amount must be greater than 0'],
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    reference: {
      type: String,
      trim: true,
    },
    referenceModel: {
      type: String,
      enum: ['Invoice', 'Bid', 'Repayment', 'Withdrawal', 'Deposit', 'System'],
      default: 'System',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'completed',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// ── Wallet schema ────────────────────────────────────────────
const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },

    frozenBalance: {
      type: Number,
      default: 0,
      min: [0, 'Frozen balance cannot be negative'],
      comment: 'Amount locked/reserved for active bids or disbursements',
    },

    currency: {
      type: String,
      default: 'PKR',
      uppercase: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    transactions: [transactionSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: available balance ───────────────────────────────
walletSchema.virtual('availableBalance').get(function () {
  return this.balance - this.frozenBalance;
});

// ── Instance method: credit ──────────────────────────────────
walletSchema.methods.credit = async function ({ amount, description, reference, referenceModel, performedBy }) {
  if (amount <= 0) throw new Error('Credit amount must be greater than 0');

  this.balance = parseFloat((this.balance + amount).toFixed(2));

  this.transactions.push({
    type: 'credit',
    amount,
    balanceAfter: this.balance,
    description,
    reference,
    referenceModel: referenceModel || 'System',
    status: 'completed',
    performedBy,
  });

  return this.save();
};

// ── Instance method: debit ───────────────────────────────────
walletSchema.methods.debit = async function ({ amount, description, reference, referenceModel, performedBy }) {
  if (amount <= 0) throw new Error('Debit amount must be greater than 0');
  if (this.availableBalance < amount) throw new Error('Insufficient wallet balance');

  this.balance = parseFloat((this.balance - amount).toFixed(2));

  this.transactions.push({
    type: 'debit',
    amount,
    balanceAfter: this.balance,
    description,
    reference,
    referenceModel: referenceModel || 'System',
    status: 'completed',
    performedBy,
  });

  return this.save();
};

// ── Instance method: freeze amount ──────────────────────────
walletSchema.methods.freeze = async function (amount) {
  if (amount <= 0) throw new Error('Freeze amount must be greater than 0');
  if (this.availableBalance < amount) throw new Error('Insufficient available balance to freeze');

  this.frozenBalance = parseFloat((this.frozenBalance + amount).toFixed(2));
  return this.save();
};

// ── Instance method: unfreeze amount ────────────────────────
walletSchema.methods.unfreeze = async function (amount) {
  if (amount <= 0) throw new Error('Unfreeze amount must be greater than 0');
  if (this.frozenBalance < amount) throw new Error('Frozen balance is less than the amount to unfreeze');

  this.frozenBalance = parseFloat((this.frozenBalance - amount).toFixed(2));
  return this.save();
};

// ── Index ────────────────────────────────────────────────────
walletSchema.index({ user: 1 });

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
