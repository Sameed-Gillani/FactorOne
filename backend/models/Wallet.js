const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Funds reserved for active investments / pending payouts
    lockedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    transactions: [
      {
        type: {
          type: String,
          enum: [
            "deposit",
            "withdrawal",
            "investment",
            "repayment",
            "fee",
            "refund",
          ],
        },
        amount: Number,
        description: String,
        reference: String,
        balanceAfter: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Wallet", walletSchema);
