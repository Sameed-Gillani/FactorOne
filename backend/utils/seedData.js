const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const MockFBR = require('../models/MockFBR');
const MockCreditScore = require('../models/MockCreditScore');

const mockFBRData = [
  { ntn: '1234567', businessName: 'Tariq Packaging Pvt Ltd', gstStatus: 'Active' },
  { ntn: '7654321', businessName: 'Sana Textiles Ltd',       gstStatus: 'Active' },
  { ntn: '9876543', businessName: 'Karimi Logistics',        gstStatus: 'Active' },
  { ntn: '1111111', businessName: 'Tech Solutions PK',       gstStatus: 'Inactive' },
  { ntn: '2222222', businessName: 'Faisal Foods Inc',        gstStatus: 'Active' },
];

const mockCreditData = [
  { companyName: 'Packages Limited',   creditScore: 'Good',    remarks: 'Blue-chip FMCG anchor. Consistent 60-day payment cycle.' },
  { companyName: 'Engro Corporation',  creditScore: 'Good',    remarks: 'Large diversified conglomerate. Reliable payment history.' },
  { companyName: 'Unilever Pakistan',  creditScore: 'Good',    remarks: 'Multinational FMCG. Excellent payment record.' },
  { companyName: 'Pakistan Tobacco',   creditScore: 'Average', remarks: 'Moderate creditworthiness. Some delayed payments on record.' },
  { companyName: 'Kohinoor Textile',   creditScore: 'Average', remarks: 'Mid-tier textile exporter. Payments mostly on time.' },
  { companyName: 'Maple Leaf Cement',  creditScore: 'Poor',    remarks: 'Cement sector facing liquidity constraints.' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Seed MockFBR
    await MockFBR.deleteMany({});
    await MockFBR.insertMany(mockFBRData);
    console.log('MockFBR seeded:', mockFBRData.length, 'records');

    // Seed MockCreditScore
    await MockCreditScore.deleteMany({});
    await MockCreditScore.insertMany(mockCreditData);
    console.log('MockCreditScore seeded:', mockCreditData.length, 'records');

    // Create admin user
    const existingAdmin = await User.findOne({ email: 'admin@factorone.pk' });
    if (!existingAdmin) {
      const admin = await User.create({
        name: 'FactorOne Admin',
        email: 'admin@factorone.pk',
        password: 'Admin@123',
        role: 'admin',
        status: 'active',
        phone: '03001234567',
        cnic: '3520100000001',
      });
      await Wallet.create({ user: admin._id, balance: 0 });
      console.log('Admin user created: admin@factorone.pk / Admin@123');
    } else {
      console.log('Admin already exists');
    }

    // Demo SME
    const existingSME = await User.findOne({ email: 'sme@factorone.pk' });
    if (!existingSME) {
      const sme = await User.create({
        name: 'Tariq Mehmood',
        email: 'sme@factorone.pk',
        password: 'Sme@12345',
        role: 'sme',
        status: 'active',
        phone: '03211234567',
        cnic: '3520100000002',
        businessName: 'Tariq Packaging Pvt Ltd',
        ntn: '1234567',
        sector: 'FMCG',
      });
      await Wallet.create({ user: sme._id, balance: 500000 });
      console.log('Demo SME created: sme@factorone.pk / Sme@12345');
    }

    // Demo Investor
    const existingInvestor = await User.findOne({ email: 'investor@factorone.pk' });
    if (!existingInvestor) {
      const investor = await User.create({
        name: 'Sana Rizvi',
        email: 'investor@factorone.pk',
        password: 'Investor@123',
        role: 'investor',
        status: 'active',
        phone: '03111234567',
        cnic: '4220100000003',
        city: 'Karachi',
        experienceLevel: 'Intermediate',
      });
      await Wallet.create({ user: investor._id, balance: 1000000 });
      console.log('Demo Investor created: investor@factorone.pk / Investor@123');
    }

    console.log('\nSeed complete!');
    console.log('─────────────────────────────────');
    console.log('Admin:    admin@factorone.pk    / Admin@123');
    console.log('SME:      sme@factorone.pk      / Sme@12345');
    console.log('Investor: investor@factorone.pk / Investor@123');
    console.log('─────────────────────────────────');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
