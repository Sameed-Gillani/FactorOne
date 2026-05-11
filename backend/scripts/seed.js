"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// ── Models ────────────────────────────────────────────────────────────────────
const User        = require("../models/User");
const Wallet      = require("../models/Wallet");
const Invoice     = require("../models/Invoice");
const Investment  = require("../models/Investment");
const Transaction = require("../models/Transaction");
const Notification= require("../models/Notification");

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  console.log("\n🌱  FactorOne Database Seeder");
  console.log("─────────────────────────────────────────────");

  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB");

  // ── Wipe existing data ──────────────────────────────────────────────────────
  console.log("🗑   Clearing existing data…");
  await Promise.all([
    User.deleteMany({}),
    Wallet.deleteMany({}),
    Invoice.deleteMany({}),
    Investment.deleteMany({}),
    Transaction.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log("✅  Collections cleared.\n");

  // ── Users ───────────────────────────────────────────────────────────────────
  console.log("👥  Creating users and wallets…");
  const password = await bcrypt.hash("Demo@1234", 12);

  const usersData = [
    {
      firstName: "Admin",
      lastName: "FactorOne",
      email: "admin@factorone.pk",
      password,
      role: "admin",
      isActive: true,
      isVerified: true,
      walletBalance: 0,
    },
    {
      firstName: "Ali",
      lastName: "Raza",
      email: "borrower@factorone.pk",
      password,
      role: "borrower",
      isActive: true,
      isVerified: true,
      walletBalance: 0,
    },
    {
      firstName: "Sara",
      lastName: "Khan",
      email: "borrower2@factorone.pk",
      password,
      role: "borrower",
      isActive: true,
      isVerified: true,
      walletBalance: 0,
    },
    {
      firstName: "Usman",
      lastName: "Sheikh",
      email: "investor@factorone.pk",
      password,
      role: "investor",
      isActive: true,
      isVerified: true,
      walletBalance: 500000,
    },
    {
      firstName: "Hina",
      lastName: "Malik",
      email: "investor2@factorone.pk",
      password,
      role: "investor",
      isActive: true,
      isVerified: true,
      walletBalance: 300000,
    },
  ];

  const users = await User.insertMany(usersData, { timestamps: true });

  const admin     = users.find(u => u.role === "admin");
  const borrower1 = users.find(u => u.email === "borrower@factorone.pk");
  const borrower2 = users.find(u => u.email === "borrower2@factorone.pk");
  const investor1 = users.find(u => u.email === "investor@factorone.pk");
  const investor2 = users.find(u => u.email === "investor2@factorone.pk");

  // ── Wallets ─────────────────────────────────────────────────────────────────
  const wallets = await Wallet.insertMany([
    { user: admin._id,     balance: 0,      currency: "PKR" },
    { user: borrower1._id, balance: 0,      currency: "PKR" },
    { user: borrower2._id, balance: 0,      currency: "PKR" },
    { user: investor1._id, balance: 500000, totalDeposited: 500000, currency: "PKR" },
    { user: investor2._id, balance: 300000, totalDeposited: 300000, currency: "PKR" },
  ]);

  const walletMap = {};
  wallets.forEach(w => { walletMap[w.user.toString()] = w; });

  for (const u of users) {
    console.log(`   ✓ ${u.role.toUpperCase().padEnd(8)} ${u.email}  (wallet: PKR ${u.walletBalance.toLocaleString()})`);
  }

  // ── Invoices ────────────────────────────────────────────────────────────────
  console.log("\n🧾  Creating invoices…");
  const now = new Date();
  const daysFromNow = d => new Date(now.getTime() + d * 86400000);

  const invoicesData = [
    {
      title: "Supply of IT Equipment - Q2",
      description: "Laptops and peripherals supplied to TechCorp Ltd",
      amount: 250000,
      currency: "PKR",
      dueDate: daysFromNow(45),
      status: "approved",
      createdBy: borrower1._id,
      borrowerId: borrower1._id,
      notes: "Net 45 payment terms agreed",
    },
    {
      title: "Office Furniture Installation",
      description: "Chairs, desks and workstations for head office",
      amount: 180000,
      currency: "PKR",
      dueDate: daysFromNow(30),
      status: "approved",
      createdBy: borrower1._id,
      borrowerId: borrower1._id,
      notes: "Delivery confirmed",
    },
    {
      title: "Printing & Packaging Services",
      description: "Bulk printing order for marketing materials",
      amount: 95000,
      currency: "PKR",
      dueDate: daysFromNow(60),
      status: "funded",
      createdBy: borrower2._id,
      borrowerId: borrower2._id,
      notes: "Order dispatched",
    },
    {
      title: "Catering Services - Annual Event",
      description: "Corporate dinner catering for 200 guests",
      amount: 120000,
      currency: "PKR",
      dueDate: daysFromNow(20),
      status: "pending",
      createdBy: borrower2._id,
      borrowerId: borrower2._id,
      notes: "Awaiting admin review",
    },
    {
      title: "Software Development Services",
      description: "Custom ERP module development",
      amount: 400000,
      currency: "PKR",
      dueDate: daysFromNow(90),
      status: "under_review",
      createdBy: borrower1._id,
      borrowerId: borrower1._id,
      notes: "Milestone 1 completed",
    },
    {
      title: "Logistics & Transport - March",
      description: "Monthly freight and delivery services",
      amount: 75000,
      currency: "PKR",
      dueDate: daysFromNow(15),
      status: "paid",
      createdBy: borrower2._id,
      borrowerId: borrower2._id,
      notes: "Fully settled",
    },
  ];

  const invoices = await Invoice.insertMany(invoicesData);
  console.log(`✅  ${invoices.length} invoices created.`);

  const approvedInv1 = invoices.find(i => i.title.includes("IT Equipment"));
  const approvedInv2 = invoices.find(i => i.title.includes("Office Furniture"));
  const fundedInv    = invoices.find(i => i.status === "funded");

  // ── Investments ─────────────────────────────────────────────────────────────
  console.log("\n💰  Creating investments…");
  const investmentsData = [
    {
      investorId: investor1._id,
      invoiceId: approvedInv1._id,
      amount: 100000,
      platformFeeRate: 3,
      platformFeeAmount: 900,
      expectedReturn: 30000,
      maturityDate: approvedInv1.dueDate,
      status: "active",
      invoiceSnapshot: {
        invoiceNumber: "INV-001",
        anchorCompany: "TechCorp Ltd",
        amountPkr: 250000,
        discountRate: 12,
      },
    },
    {
      investorId: investor1._id,
      invoiceId: approvedInv2._id,
      amount: 80000,
      platformFeeRate: 3,
      platformFeeAmount: 720,
      expectedReturn: 9600,
      maturityDate: approvedInv2.dueDate,
      status: "active",
      invoiceSnapshot: {
        invoiceNumber: "INV-002",
        anchorCompany: "OfficePlus",
        amountPkr: 180000,
        discountRate: 12,
      },
    },
    {
      investorId: investor2._id,
      invoiceId: fundedInv._id,
      amount: 50000,
      platformFeeRate: 3,
      platformFeeAmount: 450,
      expectedReturn: 6000,
      maturityDate: fundedInv.dueDate,
      status: "active",
      invoiceSnapshot: {
        invoiceNumber: "INV-003",
        anchorCompany: "PrintMaster",
        amountPkr: 95000,
        discountRate: 12,
      },
    },
    {
      investorId: investor2._id,
      invoiceId: approvedInv1._id,
      amount: 60000,
      platformFeeRate: 3,
      platformFeeAmount: 540,
      expectedReturn: 7200,
      maturityDate: approvedInv1.dueDate,
      status: "matured",
      maturedAt: new Date(now.getTime() - 5 * 86400000),
      invoiceSnapshot: {
        invoiceNumber: "INV-001",
        anchorCompany: "TechCorp Ltd",
        amountPkr: 250000,
        discountRate: 12,
      },
    },
  ];

  const investments = await Investment.insertMany(investmentsData);
  console.log(`✅  ${investments.length} investments created.`);

  // ── Transactions ─────────────────────────────────────────────────────────────
  console.log("\n💳  Creating transactions…");
  const w1 = walletMap[investor1._id.toString()];
  const w2 = walletMap[investor2._id.toString()];

  const txData = [
    {
      walletId: w1._id,
      userId: investor1._id,
      type: "topup",
      amount: 500000,
      balanceAfter: 500000,
      description: "Initial wallet top-up",
      direction: "credit",
      paymentMethod: "bank_transfer",
    },
    {
      walletId: w1._id,
      userId: investor1._id,
      type: "investment",
      amount: 100000,
      balanceAfter: 400000,
      description: "Investment in INV-001",
      direction: "debit",
      referenceId: investments[0]._id,
      referenceModel: "Investment",
    },
    {
      walletId: w1._id,
      userId: investor1._id,
      type: "investment",
      amount: 80000,
      balanceAfter: 320000,
      description: "Investment in INV-002",
      direction: "debit",
      referenceId: investments[1]._id,
      referenceModel: "Investment",
    },
    {
      walletId: w2._id,
      userId: investor2._id,
      type: "topup",
      amount: 300000,
      balanceAfter: 300000,
      description: "Initial wallet top-up",
      direction: "credit",
      paymentMethod: "bank_transfer",
    },
    {
      walletId: w2._id,
      userId: investor2._id,
      type: "investment",
      amount: 50000,
      balanceAfter: 250000,
      description: "Investment in INV-003",
      direction: "debit",
      referenceId: investments[2]._id,
      referenceModel: "Investment",
    },
    {
      walletId: w2._id,
      userId: investor2._id,
      type: "investment",
      amount: 60000,
      balanceAfter: 190000,
      description: "Investment in INV-001 (matured)",
      direction: "debit",
      referenceId: investments[3]._id,
      referenceModel: "Investment",
    },
    {
      walletId: w2._id,
      userId: investor2._id,
      type: "disbursement",
      amount: 67200,
      balanceAfter: 257200,
      description: "Maturity payout for INV-001",
      direction: "credit",
      referenceId: investments[3]._id,
      referenceModel: "Investment",
    },
  ];

  const transactions = await Transaction.insertMany(txData);
  console.log(`✅  ${transactions.length} transactions created.`);

  // ── Notifications ────────────────────────────────────────────────────────────
  console.log("\n🔔  Creating notifications…");

  // Check what fields Notification model expects
  const notifData = [
    {
      recipient: investor1._id,
      title: "Investment Confirmed",
      message: "Your investment of PKR 100,000 in INV-001 has been confirmed.",
      isRead: false,
    },
    {
      recipient: investor1._id,
      title: "New Invoice Available",
      message: "A new approved invoice is available in the marketplace.",
      isRead: true,
    },
    {
      recipient: investor2._id,
      title: "Investment Matured",
      message: "Your investment in INV-001 has matured. PKR 67,200 credited to your wallet.",
      isRead: false,
    },
    {
      recipient: borrower1._id,
      title: "Invoice Approved",
      message: "Your invoice 'Supply of IT Equipment - Q2' has been approved.",
      isRead: false,
    },
    {
      recipient: borrower2._id,
      title: "Invoice Under Review",
      message: "Your invoice is currently under review by the admin team.",
      isRead: true,
    },
    {
      recipient: admin._id,
      title: "New Invoice Submitted",
      message: "A new invoice has been submitted and requires your review.",
      isRead: false,
    },
  ];

  try {
    const notifications = await Notification.insertMany(notifData);
    console.log(`✅  ${notifications.length} notifications created.`);
  } catch (err) {
    console.log("⚠️   Notifications skipped (schema mismatch) — not critical:", err.message);
  }

  console.log("\n🎉  Seeding complete!");
  console.log("─────────────────────────────────────────────");
  console.log("Demo accounts (password: Demo@1234)");
  console.log("  admin      → admin@factorone.pk");
  console.log("  borrower   → borrower@factorone.pk");
  console.log("  borrower2  → borrower2@factorone.pk");
  console.log("  investor   → investor@factorone.pk");
  console.log("  investor2  → investor2@factorone.pk");
  console.log("─────────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});