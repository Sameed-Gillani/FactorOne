const Invoice = require("../models/Invoice");
const { cleanupFile } = require("../middlewares/uploadMiddleware");

// ─── Create Invoice (with file upload) ────────────────────────────────────────
// The uploadSingle("invoiceFile") middleware runs BEFORE this handler via the route.
// By the time this function is called:
//   - req.uploadedFile is set with safe UUID filename, url, size, mimetype
//   - File has already been validated (type, size, magic bytes)
exports.createInvoice = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      currency,
      dueDate,
      borrowerId,
      notes,
    } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!title || !amount) {
      // Cleanup the uploaded file if validation fails
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: "Invoice title and amount are required.",
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number.",
      });
    }

    // ── Build invoice document ──────────────────────────────────────────────
    const invoiceData = {
      title: title.trim(),
      description: description?.trim() || "",
      amount: parsedAmount,
      currency: currency || "USD",
      dueDate: dueDate ? new Date(dueDate) : null,
      borrowerId: borrowerId || req.user.id,
      createdBy: req.user.id,
      notes: notes?.trim() || "",
      status: "pending",
    };

    // Attach file info if a file was uploaded
    if (req.uploadedFile) {
      invoiceData.file = {
        filename: req.uploadedFile.filename,      // UUID-safe name on disk
        originalName: req.uploadedFile.originalName, // Display name only
        mimetype: req.uploadedFile.mimetype,
        size: req.uploadedFile.size,
        url: req.uploadedFile.url,
        uploadedAt: new Date(),
      };
    }

    const invoice = await Invoice.create(invoiceData);

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully.",
      invoice,
    });
  } catch (err) {
    // Always clean up uploaded file on any error
    if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
    console.error("[INVOICE] createInvoice error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create invoice. Please try again.",
    });
  }
};

// ─── Get All Invoices ─────────────────────────────────────────────────────────
exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter — admin sees all, others see only their own
    const filter = {};
    if (req.user.role !== "admin") {
      filter.$or = [
        { createdBy: req.user.id },
        { borrowerId: req.user.id },
      ];
    }
    if (status) filter.status = status;
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate("createdBy", "firstName lastName email")
        .populate("borrowerId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Invoice.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      invoices,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("[INVOICE] getAllInvoices error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch invoices." });
  }
};

// ─── Get Single Invoice ───────────────────────────────────────────────────────
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")
      .populate("borrowerId", "firstName lastName email");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    // Access control: non-admins can only view their own invoices
    if (
      req.user.role !== "admin" &&
      invoice.createdBy._id.toString() !== req.user.id &&
      invoice.borrowerId?._id?.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    return res.status(200).json({ success: true, invoice });
  } catch (err) {
    console.error("[INVOICE] getInvoiceById error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch invoice." });
  }
};

// ─── Update Invoice ───────────────────────────────────────────────────────────
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    // Only creator or admin can update
    if (
      req.user.role !== "admin" &&
      invoice.createdBy.toString() !== req.user.id
    ) {
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Prevent editing finalised invoices
    if (["paid", "cancelled"].includes(invoice.status) && req.user.role !== "admin") {
      if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
      return res.status(400).json({
        success: false,
        message: `Cannot edit an invoice with status "${invoice.status}".`,
      });
    }

    const allowedUpdates = ["title", "description", "amount", "currency", "dueDate", "notes", "status"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        invoice[field] = field === "amount" ? parseFloat(req.body[field]) : req.body[field];
      }
    });

    // If a new file was uploaded, replace old file
    if (req.uploadedFile) {
      // Delete old file if it exists
      if (invoice.file?.filename) {
        const oldPath = require("path").join(
          require("../middlewares/uploadMiddleware").UPLOAD_DIR,
          invoice.file.filename
        );
        cleanupFile(oldPath);
      }

      invoice.file = {
        filename: req.uploadedFile.filename,
        originalName: req.uploadedFile.originalName,
        mimetype: req.uploadedFile.mimetype,
        size: req.uploadedFile.size,
        url: req.uploadedFile.url,
        uploadedAt: new Date(),
      };
    }

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully.",
      invoice,
    });
  } catch (err) {
    if (req.uploadedFile) cleanupFile(req.uploadedFile.path);
    console.error("[INVOICE] updateInvoice error:", err);
    return res.status(500).json({ success: false, message: "Failed to update invoice." });
  }
};

// ─── Delete Invoice ───────────────────────────────────────────────────────────
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    // Only creator or admin can delete
    if (
      req.user.role !== "admin" &&
      invoice.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Delete associated file from disk
    if (invoice.file?.filename) {
      const filePath = require("path").join(
        require("../middlewares/uploadMiddleware").UPLOAD_DIR,
        invoice.file.filename
      );
      cleanupFile(filePath);
    }

    await invoice.deleteOne();

    return res.status(200).json({ success: true, message: "Invoice deleted successfully." });
  } catch (err) {
    console.error("[INVOICE] deleteInvoice error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete invoice." });
  }
};

// ─── Update Invoice Status ────────────────────────────────────────────────────
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "under_review", "approved", "funded", "paid", "rejected", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}.`,
      });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status, statusUpdatedAt: new Date(), statusUpdatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Invoice status updated to "${status}".`,
      invoice,
    });
  } catch (err) {
    console.error("[INVOICE] updateInvoiceStatus error:", err);
    return res.status(500).json({ success: false, message: "Failed to update invoice status." });
  }
};
