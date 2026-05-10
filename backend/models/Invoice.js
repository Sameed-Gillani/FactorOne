const mongoose = require("mongoose");

const InvoiceFileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },    // UUID-safe name on disk
    originalName: { type: String, required: true }, // Display name only
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },         // bytes
    url: { type: String, required: true },          // /uploads/<uuid>.<ext>
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Invoice title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    amount: {
      type: Number,
      required: [true, "Invoice amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      maxlength: 3,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "funded", "paid", "rejected", "cancelled"],
      default: "pending",
    },
    statusUpdatedAt: { type: Date, default: null },
    statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // The user who created/submitted the invoice
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The borrower associated with the invoice (may differ from creator for admin-created)
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    // Attached document (uploaded via uploadMiddleware)
    file: {
      type: InvoiceFileSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
InvoiceSchema.index({ createdBy: 1 });
InvoiceSchema.index({ borrowerId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model("Invoice", InvoiceSchema);
module.exports = Invoice;
