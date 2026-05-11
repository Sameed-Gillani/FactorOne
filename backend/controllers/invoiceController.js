const Invoice = require("../models/Invoice");
const MockFBR = require("../models/MockFBR");
const MockCreditScore = require("../models/MockCreditScore");
const { cleanupFile } = require("../middlewares/uploadMiddleware");

// ─── SME: Create Invoice ──────────────────────────────────────────────────────
exports.createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, anchorCompany, amountPkr, issueDate, dueDate, ntn, sector, discountRate } = req.body;

    if (!invoiceNumber || !anchorCompany || !amountPkr || !issueDate || !dueDate || !ntn) {
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(400).json({ success: false, message: "All invoice fields are required." });
    }

    const amount = parseFloat(amountPkr);
    if (isNaN(amount) || amount < 50000) {
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(400).json({ success: false, message: "Amount must be at least PKR 50,000." });
    }

    const due = new Date(dueDate);
    const minDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (due < minDue) {
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(400).json({ success: false, message: "Due date must be at least 30 days from today." });
    }

    // Check duplicate invoice number for same SME
    const existing = await Invoice.findOne({ invoiceNumber, smeId: req.user.id });
    if (existing) {
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(409).json({ success: false, message: "An invoice with this number already exists." });
    }

    const invoiceData = {
      invoiceNumber: invoiceNumber.trim(),
      smeId: req.user.id,
      anchorCompany: anchorCompany.trim(),
      amountPkr: amount,
      issueDate: new Date(issueDate),
      dueDate: due,
      ntn: ntn.trim(),
      sector: sector || "",
      discountRate: discountRate ? parseFloat(discountRate) : 3,
      status: "pending",
    };

    if (req.uploadedFile) {
      invoiceData.file = {
        filename: req.uploadedFile.filename,
        originalName: req.uploadedFile.originalName,
        mimetype: req.uploadedFile.mimetype,
        size: req.uploadedFile.size,
        url: req.uploadedFile.url,
        uploadedAt: new Date(),
      };
    }

    const invoice = await Invoice.create(invoiceData);
    return res.status(201).json({ success: true, message: "Invoice submitted successfully.", invoice });
  } catch (err) {
    if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
    console.error("[INVOICE] createInvoice error:", err);
    return res.status(500).json({ success: false, message: "Failed to create invoice." });
  }
};

// ─── SME: Get My Invoices ─────────────────────────────────────────────────────
exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ smeId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, invoices });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch invoices." });
  }
};

// ─── Investor: Get Marketplace (verified invoices) ────────────────────────────
exports.getMarketplace = async (req, res) => {
  try {
    const { sector, minYield, maxDays } = req.query;
    const filter = { status: "verified" };
    if (sector) filter.sector = sector;

    const invoices = await Invoice.find(filter)
      .populate("smeId", "name businessName sector")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, invoices });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch marketplace." });
  }
};

// ─── Get Single Invoice ───────────────────────────────────────────────────────
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("smeId", "name email businessName ntn sector phone");
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    // SMEs can only see their own invoices
    if (req.user.role === "sme" && invoice.smeId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    return res.status(200).json({ success: true, invoice });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch invoice." });
  }
};

// ─── Admin: Approve Invoice ───────────────────────────────────────────────────
exports.approveInvoice = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    invoice.status = "verified";
    invoice.adminNote = adminNote || "Approved";
    await invoice.save();

    // Notify SME
    try {
      const Notification = require("../models/Notification");
      await Notification.create({
        recipient: invoice.smeId,
        type: "invoice_approved",
        title: "Invoice Approved",
        message: `Your invoice ${invoice.invoiceNumber} has been approved and is now live on the marketplace.`,
        isRead: false,
      });
    } catch (e) {}

    return res.status(200).json({ success: true, message: "Invoice approved.", invoice });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to approve invoice." });
  }
};

// ─── Admin: Reject Invoice ────────────────────────────────────────────────────
exports.rejectInvoice = async (req, res) => {
  try {
    const { adminNote } = req.body;
    if (!adminNote) return res.status(400).json({ success: false, message: "A rejection reason is required." });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    invoice.status = "rejected";
    invoice.adminNote = adminNote;
    await invoice.save();

    try {
      const Notification = require("../models/Notification");
      await Notification.create({
        recipient: invoice.smeId,
        type: "invoice_rejected",
        title: "Invoice Rejected",
        message: `Your invoice ${invoice.invoiceNumber} was rejected. Reason: ${adminNote}`,
        isRead: false,
      });
    } catch (e) {}

    return res.status(200).json({ success: true, message: "Invoice rejected.", invoice });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to reject invoice." });
  }
};

// ─── Admin: FBR Check ─────────────────────────────────────────────────────────
exports.fbrCheck = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    const fbrRecord = await MockFBR.findOne({ ntn: invoice.ntn });
    const status = fbrRecord ? "matched" : "not_found";

    invoice.fbrStatus = status;
    await invoice.save();

    return res.status(200).json({
      success: true,
      fbrStatus: status,
      fbrRecord: fbrRecord || null,
      message: fbrRecord ? `NTN matched: ${fbrRecord.businessName} (${fbrRecord.gstStatus})` : "NTN not found in FBR records.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "FBR check failed." });
  }
};

// ─── Admin: Credit Score Check ────────────────────────────────────────────────
exports.creditCheck = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });

    const creditRecord = await MockCreditScore.findOne({
      companyName: { $regex: new RegExp(invoice.anchorCompany, "i") },
    });
    const score = creditRecord ? creditRecord.creditScore : "Poor";

    invoice.creditScore = score;
    await invoice.save();

    return res.status(200).json({
      success: true,
      creditScore: score,
      remarks: creditRecord?.remarks || "No credit data available.",
      message: `Credit score for ${invoice.anchorCompany}: ${score}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Credit check failed." });
  }
};

// ─── Admin: Get All Invoices ──────────────────────────────────────────────────
exports.getAllInvoices = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate("smeId", "name email businessName ntn sector phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, invoices, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch invoices." });
  }
};
