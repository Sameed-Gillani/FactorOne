const mongoose = require('mongoose');

const mockFBRSchema = new mongoose.Schema(
  {
    ntn: {
      type: String,
      required: [true, 'NTN is required'],
      unique: true,
      trim: true,
      match: [/^\d{7}$/, 'NTN must be a 7-digit number'],
    },

    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },

    gstStatus: {
      type: String,
      enum: {
        values: ['Active', 'Inactive', 'Suspended'],
        message: 'GST status must be Active, Inactive, or Suspended',
      },
      default: 'Active',
    },

    registrationDate: {
      type: Date,
      default: null,
    },

    taxCategory: {
      type: String,
      enum: ['Manufacturer', 'Retailer', 'Service Provider', 'Importer', 'Exporter'],
      default: 'Service Provider',
    },
  },
  {
    timestamps: true,
  }
);

// ── Seed data (5 sample NTNs) ────────────────────────────────
mockFBRSchema.statics.SEED_DATA = [
  {
    ntn: '1234567',
    businessName: 'Pak Textile Mills Ltd',
    gstStatus: 'Active',
    taxCategory: 'Manufacturer',
    registrationDate: new Date('2015-03-12'),
  },
  {
    ntn: '2345678',
    businessName: 'Horizon Tech Solutions',
    gstStatus: 'Active',
    taxCategory: 'Service Provider',
    registrationDate: new Date('2018-07-20'),
  },
  {
    ntn: '3456789',
    businessName: 'Al-Baraka Traders',
    gstStatus: 'Inactive',
    taxCategory: 'Retailer',
    registrationDate: new Date('2012-01-05'),
  },
  {
    ntn: '4567890',
    businessName: 'Karachi Steel Works',
    gstStatus: 'Active',
    taxCategory: 'Manufacturer',
    registrationDate: new Date('2010-11-30'),
  },
  {
    ntn: '5678901',
    businessName: 'Swift Logistics Pakistan',
    gstStatus: 'Suspended',
    taxCategory: 'Service Provider',
    registrationDate: new Date('2019-04-15'),
  },
];

// ── Index ────────────────────────────────────────────────────
mockFBRSchema.index({ ntn: 1 });

const MockFBR = mongoose.model('MockFBR', mockFBRSchema);
module.exports = MockFBR;
