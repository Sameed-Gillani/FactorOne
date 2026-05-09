const mongoose = require('mongoose');

// ── Auto-generate invoice number ─────────────────────────────
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FO-INV-${timestamp}-${random}`;
};

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      default: generateInvoiceNumber,
      trim: true,
    },

    smeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'SME reference is required'],
    },

    anchorCompany: {
      type: String,
      required: [true, 'Anchor company name is required'],
      trim: true,
      maxlength: [200, 'Anchor company name cannot exceed 200 characters'],
    },

    amountPkr: {
      type: Number,
      required: [true, 'Invoice amount is required'],
      min: [50000, 'Minimum invoice amount is PKR 50,000'],
    },

    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },

    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      validate: {
        validator: function (value) {
          // dueDate must be at least 30 days after issueDate
          const issueDate = this.issueDate || new Date();
          const minDue = new Date(issueDate);
          minDue.setDate(minDue.getDate() + 30);
          return value >= minDue;
        },
        message: 'Due date must be at least 30 days after the issue date',
      },
    },

    ntn: {
      type: String,
      required: [true, 'NTN is required'],
      trim: true,
      match: [/^\d{7}$/, 'NTN must be a 7-digit number'],
    },

    // ── Admin-managed status ─────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'funded', 'rejected'],
        message: 'Status must be pending, verified, funded, or rejected',
      },
      default: 'pending',
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin note cannot exceed 1000 characters'],
      default: null,
    },

    // ── FBR verification result ──────────────────────────────
    fbrStatus: {
      type: String,
      enum: {
        values: ['unchecked', 'matched', 'not_found'],
        message: 'FBR status must be unchecked, matched, or not_found',
      },
      default: 'unchecked',
    },

    fbrCheckedAt: {
      type: Date,
      default: null,
    },

    fbrCheckedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Credit score ─────────────────────────────────────────
    creditScore: {
      type: String,
      enum: {
        values: ['N/A', 'Good', 'Average', 'Poor'],
        message: 'Credit score must be N/A, Good, Average, or Poor',
      },
      default: 'N/A',
    },

    creditCheckedAt: {
      type: Date,
      default: null,
    },

    creditCheckedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Funding details ──────────────────────────────────────
    fundedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Funded amount cannot be negative'],
    },

    discountRate: {
      type: Number,
      default: 3,
      min: [0, 'Discount rate cannot be negative'],
      max: [100, 'Discount rate cannot exceed 100'],
      comment: 'Percentage fee charged on the funded amount',
    },

    fundedAt: {
      type: Date,
      default: null,
    },

    // ── Supporting documents (uploaded via multer) ───────────
    documents: [
      {
        filename: { type: String },
        originalName: { type: String },
        mimetype: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Rejection tracking ───────────────────────────────────
    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Approval tracking ────────────────────────────────────
    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: net receivable after discount ───────────────────
invoiceSchema.virtual('netReceivable').get(function () {
  if (!this.fundedAmount) return 0;
  return parseFloat((this.fundedAmount * (1 - this.discountRate / 100)).toFixed(2));
});

// ── Virtual: days until due ──────────────────────────────────
invoiceSchema.virtual('daysUntilDue').get(function () {
  if (!this.dueDate) return null;
  const diff = this.dueDate - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ── Indexes ──────────────────────────────────────────────────
invoiceSchema.index({ smeId: 1, status: 1 });
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ ntn: 1 });
invoiceSchema.index({ anchorCompany: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
