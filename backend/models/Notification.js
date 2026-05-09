const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "account_activated",
        "account_blocked",
        "invoice_approved",
        "invoice_rejected",
        "invoice_funded",
        "invoice_repaid",
        "investment_confirmed",
        "repayment_received",
        "withdrawal_processed",
        "general",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Optional deep-link reference
    reference: {
      model: {
        type: String,
        enum: ["Invoice", "Wallet", "User"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast per-user queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
