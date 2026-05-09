const mongoose = require('mongoose');

const mockCreditScoreSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },

    creditScore: {
      type: String,
      required: [true, 'Credit score is required'],
      enum: {
        values: ['Good', 'Average', 'Poor'],
        message: 'Credit score must be Good, Average, or Poor',
      },
    },

    creditLimit: {
      type: Number,
      default: null,
      comment: 'Maximum credit exposure in PKR',
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Seed data (5 sample companies) ──────────────────────────
mockCreditScoreSchema.statics.SEED_DATA = [
  {
    companyName: 'Pak Textile Mills Ltd',
    creditScore: 'Good',
    creditLimit: 50000000,
    remarks: 'Consistent repayment history. Low default risk.',
    lastUpdated: new Date('2024-09-01'),
  },
  {
    companyName: 'Horizon Tech Solutions',
    creditScore: 'Average',
    creditLimit: 20000000,
    remarks: 'Moderate risk. Two late payments in last 18 months.',
    lastUpdated: new Date('2024-10-15'),
  },
  {
    companyName: 'Al-Baraka Traders',
    creditScore: 'Poor',
    creditLimit: 5000000,
    remarks: 'Multiple defaults. High risk — proceed with caution.',
    lastUpdated: new Date('2024-08-20'),
  },
  {
    companyName: 'Karachi Steel Works',
    creditScore: 'Good',
    creditLimit: 100000000,
    remarks: 'Blue-chip client. Excellent payment track record.',
    lastUpdated: new Date('2024-11-01'),
  },
  {
    companyName: 'Swift Logistics Pakistan',
    creditScore: 'Average',
    creditLimit: 15000000,
    remarks: 'Seasonal cash flow dips. Otherwise reliable.',
    lastUpdated: new Date('2024-07-30'),
  },
];

// ── Index ────────────────────────────────────────────────────
mockCreditScoreSchema.index({ companyName: 1 });

const MockCreditScore = mongoose.model('MockCreditScore', mockCreditScoreSchema);
module.exports = MockCreditScore;
