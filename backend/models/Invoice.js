const mongoose = require("mongoose");

const InvoiceFileSchema = new mongoose.Schema(
  {
    filename:     { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype:     { type: String, required: true },
    size:         { type: Number, required: true },
    url:          { type: String, required: true },
    uploadedAt:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber:  { type: String, required: [true, "Invoice number is required"], trim: true },
    smeId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    anchorCompany:  { type: String, required: [true, "Anchor company is required"], trim: true },
    amountPkr:      { type: Number, required: [true, "Amount is required"], min: [50000, "Minimum invoice amount is PKR 50,000"] },
    issueDate:      { type: Date, required: [true, "Issue date is required"] },
    dueDate:        { type: Date, required: [true, "Due date is required"] },
    ntn:            { type: String, required: [true, "NTN is required"], trim: true },
    sector:         { type: String, trim: true, default: "" },
    discountRate:   { type: Number, default: 3, min: 1, max: 10 },
    fundedAmount:   { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "verified", "funded", "rejected"],
      default: "pending",
    },
    adminNote:    { type: String, trim: true, default: "" },
    fbrStatus:    { type: String, enum: ["unchecked", "matched", "not_found"], default: "unchecked" },
    creditScore:  { type: String, enum: ["N/A", "Good", "Average", "Poor"], default: "N/A" },
    file:         { type: InvoiceFileSchema, default: null },
    fundedAt:     { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) { delete ret.__v; return ret; },
    },
  }
);

InvoiceSchema.index({ smeId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ anchorCompany: 1 });
InvoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model("Invoice", InvoiceSchema);
module.exports = Invoice;
