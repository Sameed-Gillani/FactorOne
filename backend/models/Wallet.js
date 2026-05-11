const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance:        { type: Number, default: 0, min: 0 },
    frozenBalance:  { type: Number, default: 0, min: 0 },
    totalDeposited: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    currency:  { type: String, default: "PKR", uppercase: true },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

walletSchema.virtual("availableBalance").get(function () {
  return Math.max(0, this.balance - this.frozenBalance);
});

walletSchema.index({ user: 1 });

module.exports = mongoose.model("Wallet", walletSchema);
