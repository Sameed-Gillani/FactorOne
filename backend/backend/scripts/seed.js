/**
 * FactorOne — Complete Database Seeder
 * Run with: node scripts/seed.js
 * This script wipes existing demo data and re-seeds everything fresh.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ── Import all models ─────────────────────────────────────────
const User         = require("../models/User");
const Wallet       = require("../models/Wallet");
const Invoice      = require("../models/Invoice");
const Investment   = require("../models/Investment");
const Transaction  = require("../models/Transaction");
const Notification = require("../models/Notification");
const MockFBR      = require("../models/MockFBR");
const MockCreditScore = require("../models/MockCreditScore");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/factorone";

// ── Demo passwords (all same for easy testing) ───────────────
const DEMO_PASSWORD = "Demo@1234";

// ── Seed accounts (mirrors Bolt demo accounts) ───────────────
const USERS = [
  {
    name: "Super Admin",
    email: "admin@factorone.pk",
    phone: "03001000001",
    cnic: "35202-1234567-1",
    role: "admin",
    status: "active",
  },
  {
    name: "Pak Textile SME",
    email: "sme@factorone.pk",
    phone: "03001000002",
    cnic: "35202-1234567-2",
    role: "sme",
    status: "active",
    businessName: "Pak Textile Mills Ltd",
    ntn: "1234567",
  },
  {
    name: "Horizon Tech SME",
    email: "sme2@factorone.pk",
    phone: "03001000003",
    cnic: "35202-1234567-3",
    role: "sme",
    status: "active",
    businessName: "Horizon Tech Solutions",
    ntn: "2345678",
  },
  {
    name: "Ahmed Investor",
    email: "investor@factorone.pk",
    phone: "03001000004",
    cnic: "35202-1234567-4",
    role: "investor",
    status: "active",
    city: "Karachi",
  },
  {
    name: "Sara Investor",
    email: "investor2@factorone.pk",
    phone: "03001000005",
    cnic: "35202-1234567-5",
    role: "investor",
    status: "active",
    city: "Lahore",
  },
];

// ── MockFBR seed data ────────────────────────────────────────
const FBR_DATA = [
  { ntn: "1234567", businessName: "Pak Textile Mills Ltd",      gstStatus: "Active",    taxCategory: "Manufacturer",      registrationDate: new Date("2015-03-12") },
  { ntn: "2345678", businessName: "Horizon Tech Solutions",     gstStatus: "Active",    taxCategory: "Service Provider",  registrationDate: new Date("2018-07-20") },
  { ntn: "3456789", businessName: "Al-Baraka Traders",         gstStatus: "Inactive",  taxCategory: "Retailer",          registrationDate: new Date("2012-01-05") },
  { ntn: "4567890", businessName: "Karachi Steel Works",       gstStatus: "Active",    taxCategory: "Manufacturer",      registrationDate: new Date("2010-11-30") },
  { ntn: "5678901", businessName: "Swift Logistics Pakistan",  gstStatus: "Suspended", taxCategory: "Service Provider",  registrationDate: new Date("2019-04-15") },
];

// ── MockCreditScore seed data ────────────────────────────────
const CREDIT_DATA = [
  { companyName: "Pak Textile Mills Ltd",     creditScore: "Good",    creditLimit: 50000000,  remarks: "Consistent repayment history. Low default risk." },
  { companyName: "Horizon Tech Solutions",    creditScore: "Average", creditLimit: 20000000,  remarks: "Moderate risk. Two late payments in last 18 months." },
  { companyName: "Al-Baraka Traders",        creditScore: "Poor",    creditLimit: 5000000,   remarks: "Multiple defaults. High risk." },
  { companyName: "Karachi Steel Works",      creditScore: "Good",    creditLimit: 100000000, remarks: "Blue-chip client. Excellent track record." },
  { companyName: "Swift Logistics Pakistan", creditScore: "Average", creditLimit: 15000000,  remarks: "Seasonal cash flow dips. Otherwise reliable." },
];

// ── Helpers ──────────────────────────────────────────────────
const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};
const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

async function seed() {
  console.log("\n🌱  FactorOne Database Seeder");
  console.log("─".repeat(45));

  // ── Connect ──────────────────────────────────────────────
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB:", MONGO_URI);

  // ── Wipe existing demo data ──────────────────────────────
  console.log("\n🗑   Clearing existing data…");
  await Promise.all([
    User.deleteMany({}),
    Wallet.deleteMany({}),
    Invoice.deleteMany({}),
    Investment.deleteMany({}),
    Transaction.deleteMany({}),
    Notification.deleteMany({}),
    MockFBR.deleteMany({}),
    MockCreditScore.deleteMany({}),
  ]);
  console.log("✅  Collections cleared.");

  // ── Seed MockFBR ──────────────────────────────────────────
  await MockFBR.insertMany(FBR_DATA);
  console.log(`✅  MockFBR: ${FBR_DATA.length} records seeded.`);

  // ── Seed MockCreditScore ──────────────────────────────────
  await MockCreditScore.insertMany(CREDIT_DATA);
  console.log(`✅  MockCreditScore: ${CREDIT_DATA.length} records seeded.`);

  // ── Hash password once for all users ─────────────────────
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Create users + wallets ────────────────────────────────
  console.log("\n👥  Creating users and wallets…");
  const createdUsers = {};
  const createdWallets = {};

  for (const userData of USERS) {
    const user = await User.create({ ...userData, password: hashedPassword });
    createdUsers[userData.email] = user;

    // Starting balances
    const startingBalance =
      userData.role === "investor" ? 500000 :
      userData.role === "sme"      ? 0 :
      0;

    const wallet = await Wallet.create({ user: user._id, balance: startingBalance });
    createdWallets[userData.email] = wallet;

    console.log(`   ✓ ${userData.role.toUpperCase().padEnd(8)} ${userData.email}  (wallet: PKR ${startingBalance.toLocaleString()})`);
  }

  // ── Shortcuts ─────────────────────────────────────────────
  const sme1   = createdUsers["sme@factorone.pk"];
  const sme2   = createdUsers["sme2@factorone.pk"];
  const inv1   = createdUsers["investor@factorone.pk"];
  const inv2   = createdUsers["investor2@factorone.pk"];
  const admin  = createdUsers["admin@factorone.pk"];

  const sme1Wallet  = createdWallets["sme@factorone.pk"];
  const sme2Wallet  = createdWallets["sme2@factorone.pk"];
  const inv1Wallet  = createdWallets["investor@factorone.pk"];
  const inv2Wallet  = createdWallets["investor2@factorone.pk"];

  // ── Create Invoices ───────────────────────────────────────
  console.log("\n🧾  Creating invoices…");

  const invoices = await Invoice.insertMany([
    // SME1 — funded invoice
    {
      invoiceNumber: "FO-INV-00000001",
      smeId: sme1._id,
      anchorCompany: "Karachi Steel Works",
      amountPkr: 500000,
      issueDate: daysAgo(60),
      dueDate: daysFromNow(30),
      ntn: "1234567",
      status: "funded",
      fbrStatus: "matched",
      creditScore: "Good",
      fundedAmount: 500000,
      discountRate: 3,
      adminNote: "Verified — strong FBR record and Good credit score.",
      approvedAt: daysAgo(50),
      approvedBy: admin._id,
    },
    // SME1 — verified (open for investment)
    {
      invoiceNumber: "FO-INV-00000002",
      smeId: sme1._id,
      anchorCompany: "Pak Textile Mills Ltd",
      amountPkr: 750000,
      issueDate: daysAgo(10),
      dueDate: daysFromNow(50),
      ntn: "1234567",
      status: "verified",
      fbrStatus: "matched",
      creditScore: "Good",
      fundedAmount: 250000,
      discountRate: 3,
      adminNote: "Approved. Partially funded.",
      approvedAt: daysAgo(8),
      approvedBy: admin._id,
    },
    // SME1 — pending
    {
      invoiceNumber: "FO-INV-00000003",
      smeId: sme1._id,
      anchorCompany: "Swift Logistics Pakistan",
      amountPkr: 300000,
      issueDate: daysAgo(5),
      dueDate: daysFromNow(35),
      ntn: "1234567",
      status: "pending",
      fbrStatus: "unchecked",
      creditScore: "N/A",
      fundedAmount: 0,
      discountRate: 3,
    },
    // SME1 — rejected
    {
      invoiceNumber: "FO-INV-00000004",
      smeId: sme1._id,
      anchorCompany: "Al-Baraka Traders",
      amountPkr: 200000,
      issueDate: daysAgo(20),
      dueDate: daysFromNow(40),
      ntn: "1234567",
      status: "rejected",
      fbrStatus: "not_found",
      creditScore: "Poor",
      fundedAmount: 0,
      discountRate: 3,
      adminNote: "Rejected — NTN not found in FBR records and Poor credit rating for anchor company.",
      rejectedAt: daysAgo(18),
      rejectedBy: admin._id,
    },
    // SME2 — verified (open for investment)
    {
      invoiceNumber: "FO-INV-00000005",
      smeId: sme2._id,
      anchorCompany: "Horizon Tech Solutions",
      amountPkr: 400000,
      issueDate: daysAgo(7),
      dueDate: daysFromNow(45),
      ntn: "2345678",
      status: "verified",
      fbrStatus: "matched",
      creditScore: "Average",
      fundedAmount: 100000,
      discountRate: 3,
      adminNote: "Approved. Average credit — acceptable risk.",
      approvedAt: daysAgo(5),
      approvedBy: admin._id,
    },
    // SME2 — pending
    {
      invoiceNumber: "FO-INV-00000006",
      smeId: sme2._id,
      anchorCompany: "Karachi Steel Works",
      amountPkr: 600000,
      issueDate: daysAgo(2),
      dueDate: daysFromNow(60),
      ntn: "2345678",
      status: "pending",
      fbrStatus: "unchecked",
      creditScore: "N/A",
      fundedAmount: 0,
      discountRate: 3,
    },
  ]);

  console.log(`✅  ${invoices.length} invoices created.`);

  const fundedInvoice   = invoices[0];
  const verifiedInv1    = invoices[1];
  const verifiedInv2    = invoices[4];

  // ── Create Investments ────────────────────────────────────
  console.log("\n💰  Creating investments…");

  const investments = await Investment.insertMany([
    // inv1 invested in funded invoice
    {
      investorId: inv1._id,
      invoiceId: fundedInvoice._id,
      amount: 300000,
      expectedReturn: 9000,
      maturityDate: fundedInvoice.dueDate,
      platformFeeRate: 3,
      platformFeeAmount: 270,
      status: "active",
      invoiceSnapshot: {
        invoiceNumber: fundedInvoice.invoiceNumber,
        anchorCompany: fundedInvoice.anchorCompany,
        amountPkr: fundedInvoice.amountPkr,
        discountRate: fundedInvoice.discountRate,
      },
    },
    // inv2 invested in funded invoice
    {
      investorId: inv2._id,
      invoiceId: fundedInvoice._id,
      amount: 200000,
      expectedReturn: 6000,
      maturityDate: fundedInvoice.dueDate,
      platformFeeRate: 3,
      platformFeeAmount: 180,
      status: "active",
      invoiceSnapshot: {
        invoiceNumber: fundedInvoice.invoiceNumber,
        anchorCompany: fundedInvoice.anchorCompany,
        amountPkr: fundedInvoice.amountPkr,
        discountRate: fundedInvoice.discountRate,
      },
    },
    // inv1 invested in verified invoice 1 (partial)
    {
      investorId: inv1._id,
      invoiceId: verifiedInv1._id,
      amount: 250000,
      expectedReturn: 7500,
      maturityDate: verifiedInv1.dueDate,
      platformFeeRate: 3,
      platformFeeAmount: 225,
      status: "active",
      invoiceSnapshot: {
        invoiceNumber: verifiedInv1.invoiceNumber,
        anchorCompany: verifiedInv1.anchorCompany,
        amountPkr: verifiedInv1.amountPkr,
        discountRate: verifiedInv1.discountRate,
      },
    },
    // inv2 invested in verified invoice 2 (partial)
    {
      investorId: inv2._id,
      invoiceId: verifiedInv2._id,
      amount: 100000,
      expectedReturn: 3000,
      maturityDate: verifiedInv2.dueDate,
      platformFeeRate: 3,
      platformFeeAmount: 90,
      status: "active",
      invoiceSnapshot: {
        invoiceNumber: verifiedInv2.invoiceNumber,
        anchorCompany: verifiedInv2.anchorCompany,
        amountPkr: verifiedInv2.amountPkr,
        discountRate: verifiedInv2.discountRate,
      },
    },
  ]);

  console.log(`✅  ${investments.length} investments created.`);

  // ── Update investor wallet balances (deduct investments) ──
  inv1Wallet.balance = 500000 - 300000 - 250000; // = -50000 → start them higher
  inv1Wallet.balance = 150000;
  await inv1Wallet.save();

  inv2Wallet.balance = 500000 - 200000 - 100000; // 200000 remaining
  inv2Wallet.balance = 200000;
  await inv2Wallet.save();

  // ── Credit SME1 wallet (funded invoice disbursement) ──────
  const disbursement = 500000 * 0.97; // minus 3% fee
  sme1Wallet.balance = disbursement;
  await sme1Wallet.save();

  // ── Create Transactions ───────────────────────────────────
  console.log("\n💳  Creating transactions…");

  const transactions = await Transaction.insertMany([
    // inv1 topup
    { walletId: inv1Wallet._id, userId: inv1._id, type: "topup",      amount: 500000, balanceAfter: 500000, direction: "credit", description: "Initial wallet top-up",             paymentMethod: "bank_transfer", status: "completed" },
    // inv1 investment 1
    { walletId: inv1Wallet._id, userId: inv1._id, type: "investment", amount: 300000, balanceAfter: 200000, direction: "debit",  description: `Investment in ${fundedInvoice.invoiceNumber}`, referenceId: fundedInvoice._id, referenceModel: "Invoice", status: "completed" },
    // inv1 investment 2
    { walletId: inv1Wallet._id, userId: inv1._id, type: "investment", amount: 250000, balanceAfter: 150000, direction: "debit",  description: `Investment in ${verifiedInv1.invoiceNumber}`, referenceId: verifiedInv1._id, referenceModel: "Invoice", status: "completed" },
    // inv2 topup
    { walletId: inv2Wallet._id, userId: inv2._id, type: "topup",      amount: 500000, balanceAfter: 500000, direction: "credit", description: "Initial wallet top-up",             paymentMethod: "bank_transfer", status: "completed" },
    // inv2 investment 1
    { walletId: inv2Wallet._id, userId: inv2._id, type: "investment", amount: 200000, balanceAfter: 300000, direction: "debit",  description: `Investment in ${fundedInvoice.invoiceNumber}`, referenceId: fundedInvoice._id, referenceModel: "Invoice", status: "completed" },
    // inv2 investment 2
    { walletId: inv2Wallet._id, userId: inv2._id, type: "investment", amount: 100000, balanceAfter: 200000, direction: "debit",  description: `Investment in ${verifiedInv2.invoiceNumber}`, referenceId: verifiedInv2._id, referenceModel: "Invoice", status: "completed" },
    // SME1 disbursement
    { walletId: sme1Wallet._id, userId: sme1._id, type: "disbursement", amount: disbursement, balanceAfter: disbursement, direction: "credit", description: `Disbursement for funded invoice ${fundedInvoice.invoiceNumber} (3% fee deducted)`, referenceId: fundedInvoice._id, referenceModel: "Invoice", feeAmount: 15000, status: "completed" },
  ]);

  console.log(`✅  ${transactions.length} transactions created.`);

  // ── Create Notifications ──────────────────────────────────
  console.log("\n🔔  Creating notifications…");

  await Notification.insertMany([
    // SME1 notifications
    { recipient: sme1._id, title: "Welcome to FactorOne!", message: "Your account has been approved. You can now submit invoices for discounting.", type: "account_approved", isRead: true },
    { recipient: sme1._id, title: "Invoice Approved ✅", message: `Invoice ${fundedInvoice.invoiceNumber} has been verified and is now visible to investors.`, type: "invoice_approved", isRead: true },
    { recipient: sme1._id, title: "💰 Invoice Fully Funded!", message: `Invoice ${fundedInvoice.invoiceNumber} is fully funded. PKR ${disbursement.toLocaleString()} has been credited to your wallet.`, type: "payment_received", isRead: false },
    { recipient: sme1._id, title: "Invoice Rejected ❌", message: `Invoice FO-INV-00000004 was rejected. Reason: NTN not found in FBR records and Poor credit rating.`, type: "invoice_rejected", isRead: false },
    // SME2 notifications
    { recipient: sme2._id, title: "Welcome to FactorOne!", message: "Your account has been approved. You can now submit invoices for discounting.", type: "account_approved", isRead: true },
    { recipient: sme2._id, title: "Invoice Approved ✅", message: `Invoice ${verifiedInv2.invoiceNumber} is now live for investors.`, type: "invoice_approved", isRead: false },
    // Investor1 notifications
    { recipient: inv1._id, title: "Welcome to FactorOne!", message: "Your investor account is active. Browse verified invoices in the Marketplace.", type: "account_approved", isRead: true },
    { recipient: inv1._id, title: "✅ Investment Confirmed", message: `You invested PKR 300,000 in ${fundedInvoice.invoiceNumber}. Expected return: PKR 9,000.`, type: "bid_placed", isRead: true },
    { recipient: inv1._id, title: "✅ Investment Confirmed", message: `You invested PKR 250,000 in ${verifiedInv1.invoiceNumber}. Expected return: PKR 7,500.`, type: "bid_placed", isRead: false },
    // Investor2 notifications
    { recipient: inv2._id, title: "Welcome to FactorOne!", message: "Your investor account is active. Browse verified invoices in the Marketplace.", type: "account_approved", isRead: true },
    { recipient: inv2._id, title: "✅ Investment Confirmed", message: `You invested PKR 200,000 in ${fundedInvoice.invoiceNumber}. Expected return: PKR 6,000.`, type: "bid_placed", isRead: false },
  ]);

  console.log(`✅  Notifications created.`);

  // ── Summary ───────────────────────────────────────────────
  console.log("\n" + "═".repeat(45));
  console.log("🎉  Seeding complete! Demo accounts:\n");
  console.log("  Role      Email                     Password");
  console.log("  ────────  ────────────────────────  ────────");
  USERS.forEach(u => {
    console.log(`  ${u.role.padEnd(8)}  ${u.email.padEnd(24)}  ${DEMO_PASSWORD}`);
  });
  console.log("\n" + "═".repeat(45));
  console.log("👉  Now run: cd frontend && npm start\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌  Seeding failed:", err.message);
  console.error(err);
  process.exit(1);
});
