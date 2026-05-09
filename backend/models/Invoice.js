const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // SME who submitted this invoice for factoring
    sme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The business/client that owes money on the invoice
    debtor: {
      name: { type: String, required: true, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Portion of the invoice amount already funded by investors
    fundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "pending",       // Submitted, awaiting admin review
        "approved",      // Approved and open for investment
        "funded",        // Fully funded by investors
        "completed",     // Debtor has paid, payout processing
        "repaid",        // All investors have been repaid
        "rejected",      // Rejected by admin
        "overdue",       // Past due date without repayment
      ],
      default: "pending",
    },
    // Discount / factoring rate offered to investors (percentage)
    discountRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Investors and their individual investment amounts
    investors: [
      {
        investor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        amount: {
          type: Number,
          min: 0,
        },
        investedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Supporting documents (URLs or file paths)
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    rejectionReason: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
