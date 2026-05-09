const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investor reference is required'],
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice reference is required'],
    },

    amount: {
      type: Number,
      required: [true, 'Investment amount is required'],
      min: [1000, 'Minimum investment amount is PKR 1,000'],
    },

    // Platform fee deducted at disbursement (stored for audit)
    platformFeeRate: {
      type: Number,
      default: 3,
      min: 0,
      max: 100,
    },

    platformFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // expectedReturn = amount * (discountRate / 100) — investor earns the discount
    expectedReturn: {
      type: Number,
      required: [true, 'Expected return is required'],
      min: 0,
    },

    // Derived from invoice dueDate at time of investment
    maturityDate: {
      type: Date,
      required: [true, 'Maturity date is required'],
    },

    status: {
      type: String,
      enum: {
        values: ['active', 'matured', 'cancelled'],
        message: 'Status must be active, matured, or cancelled',
      },
      default: 'active',
    },

    maturedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },

    // Snapshot of invoice details at investment time (for historical accuracy)
    invoiceSnapshot: {
      invoiceNumber: String,
      anchorCompany: String,
      amountPkr: Number,
      discountRate: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: total return at maturity (principal + profit) ───
investmentSchema.virtual('totalReturn').get(function () {
  return parseFloat((this.amount + this.expectedReturn).toFixed(2));
});

// ── Virtual: net after fee ───────────────────────────────────
investmentSchema.virtual('netReturn').get(function () {
  return parseFloat((this.expectedReturn - this.platformFeeAmount).toFixed(2));
});

// ── Indexes ──────────────────────────────────────────────────
investmentSchema.index({ investorId: 1, status: 1 });
investmentSchema.index({ invoiceId: 1 });
investmentSchema.index({ investorId: 1, invoiceId: 1 });
investmentSchema.index({ maturityDate: 1, status: 1 });

const Investment = mongoose.model('Investment', investmentSchema);
module.exports = Investment;
