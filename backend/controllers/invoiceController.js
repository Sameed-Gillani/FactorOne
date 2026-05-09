const { validationResult } = require('express-validator');
const Invoice = require('../models/Invoice');
const MockFBR = require('../models/MockFBR');
const MockCreditScore = require('../models/MockCreditScore');
const Notification = require('../models/Notification');

// ── Helper ────────────────────────────────────────────────────
const formatValidationErrors = (errors) =>
  errors.array().map((e) => ({ field: e.path, message: e.msg }));

// ─────────────────────────────────────────────────────────────
// @route   POST /api/invoices
// @desc    SME submits a new invoice for discounting
// @access  Private — SME only
// ─────────────────────────────────────────────────────────────
const submitInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const { anchorCompany, amountPkr, issueDate, dueDate, ntn } = req.body;

    // Build document list from multer uploads (if any)
    const documents = (req.files || []).map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    }));

    const invoice = await Invoice.create({
      smeId: req.user._id,
      anchorCompany,
      amountPkr,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      ntn,
      documents,
    });

    // Notify the SME
    await Notification.send({
      recipient: req.user._id,
      title: 'Invoice Submitted',
      message: `Your invoice ${invoice.invoiceNumber} for PKR ${amountPkr.toLocaleString()} has been submitted and is pending admin review.`,
      type: 'invoice_submitted',
      link: `/invoices/${invoice._id}`,
      metadata: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber },
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice submitted successfully. Pending admin review.',
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/invoices/my
// @desc    SME fetches their own invoices (paginated)
// @access  Private — SME only
// ─────────────────────────────────────────────────────────────
const getMyInvoices = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = { smeId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-documents'), // strip heavy doc metadata from list view
      Invoice.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/invoices
// @desc    Investor fetches all verified invoices available for bidding
// @access  Private — Investor only
// ─────────────────────────────────────────────────────────────
const getAllVerified = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Investors see only verified invoices
    const filter = { status: 'verified' };

    // Optional filters
    if (req.query.minAmount) filter.amountPkr = { $gte: Number(req.query.minAmount) };
    if (req.query.maxAmount) {
      filter.amountPkr = { ...filter.amountPkr, $lte: Number(req.query.maxAmount) };
    }
    if (req.query.creditScore) filter.creditScore = req.query.creditScore;
    if (req.query.anchorCompany) {
      filter.anchorCompany = { $regex: req.query.anchorCompany, $options: 'i' };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('smeId', 'name businessName city')
        .select('-documents -adminNote'),
      Invoice.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/invoices/:id
// @desc    Get invoice by ID (SME sees own, admin sees all, investor sees verified)
// @access  Private — any authenticated user
// ─────────────────────────────────────────────────────────────
const getById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('smeId', 'name email phone businessName ntn')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .populate('fbrCheckedBy', 'name email')
      .populate('creditCheckedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const { role, _id } = req.user;

    // SME: can only view their own invoices
    if (role === 'sme' && invoice.smeId._id.toString() !== _id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own invoices.',
      });
    }

    // Investor: can only view verified or funded invoices
    if (role === 'investor' && !['verified', 'funded'].includes(invoice.status)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This invoice is not available for investors.',
      });
    }

    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   PATCH /api/invoices/:id/approve
// @desc    Admin approves (verifies) an invoice
// @access  Private — Admin only
// ─────────────────────────────────────────────────────────────
const approveInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve an invoice with status '${invoice.status}'. Only pending invoices can be approved.`,
      });
    }

    const { adminNote, discountRate, fundedAmount } = req.body;

    invoice.status = 'verified';
    invoice.adminNote = adminNote || null;
    invoice.approvedAt = new Date();
    invoice.approvedBy = req.user._id;

    if (discountRate !== undefined) invoice.discountRate = discountRate;
    if (fundedAmount !== undefined) invoice.fundedAmount = fundedAmount;

    await invoice.save();

    // Notify SME
    await Notification.send({
      recipient: invoice.smeId,
      title: 'Invoice Approved ✅',
      message: `Your invoice ${invoice.invoiceNumber} has been verified and is now visible to investors.${adminNote ? ` Admin note: ${adminNote}` : ''}`,
      type: 'invoice_approved',
      link: `/invoices/${invoice._id}`,
      metadata: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber },
    });

    return res.status(200).json({
      success: true,
      message: 'Invoice approved and status set to verified.',
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   PATCH /api/invoices/:id/reject
// @desc    Admin rejects an invoice with a mandatory reason note
// @access  Private — Admin only
// ─────────────────────────────────────────────────────────────
const rejectInvoice = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (!['pending', 'verified'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject an invoice with status '${invoice.status}'.`,
      });
    }

    const { adminNote } = req.body;

    invoice.status = 'rejected';
    invoice.adminNote = adminNote;
    invoice.rejectedAt = new Date();
    invoice.rejectedBy = req.user._id;

    await invoice.save();

    // Notify SME
    await Notification.send({
      recipient: invoice.smeId,
      title: 'Invoice Rejected ❌',
      message: `Your invoice ${invoice.invoiceNumber} has been rejected. Reason: ${adminNote}`,
      type: 'invoice_rejected',
      link: `/invoices/${invoice._id}`,
      metadata: { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber },
    });

    return res.status(200).json({
      success: true,
      message: 'Invoice rejected.',
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/invoices/:id/fbr-check
// @desc    Admin runs FBR NTN verification against MockFBR collection
// @access  Private — Admin only
// ─────────────────────────────────────────────────────────────
const fbrCheck = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Look up NTN in MockFBR database
    const fbrRecord = await MockFBR.findOne({ ntn: invoice.ntn });

    const fbrMatched = !!fbrRecord;
    const newFbrStatus = fbrMatched ? 'matched' : 'not_found';

    invoice.fbrStatus = newFbrStatus;
    invoice.fbrCheckedAt = new Date();
    invoice.fbrCheckedBy = req.user._id;

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: fbrMatched
        ? 'NTN verified successfully. FBR record found.'
        : 'NTN not found in FBR database.',
      fbrCheck: {
        ntn: invoice.ntn,
        status: newFbrStatus,
        checkedAt: invoice.fbrCheckedAt,
        ...(fbrRecord && {
          fbrRecord: {
            businessName: fbrRecord.businessName,
            gstStatus: fbrRecord.gstStatus,
            taxCategory: fbrRecord.taxCategory,
            registrationDate: fbrRecord.registrationDate,
          },
        }),
      },
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        fbrStatus: invoice.fbrStatus,
        fbrCheckedAt: invoice.fbrCheckedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/invoices/:id/credit-check
// @desc    Admin runs credit check on anchor company via MockCreditScore
// @access  Private — Admin only
// ─────────────────────────────────────────────────────────────
const creditCheck = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Case-insensitive match on anchor company name
    const creditRecord = await MockCreditScore.findOne({
      companyName: { $regex: new RegExp(`^${invoice.anchorCompany.trim()}$`, 'i') },
    });

    const newCreditScore = creditRecord ? creditRecord.creditScore : 'N/A';

    invoice.creditScore = newCreditScore;
    invoice.creditCheckedAt = new Date();
    invoice.creditCheckedBy = req.user._id;

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: creditRecord
        ? `Credit score found for '${invoice.anchorCompany}'.`
        : `No credit record found for '${invoice.anchorCompany}'. Score set to N/A.`,
      creditCheck: {
        anchorCompany: invoice.anchorCompany,
        creditScore: newCreditScore,
        checkedAt: invoice.creditCheckedAt,
        ...(creditRecord && {
          creditRecord: {
            companyName: creditRecord.companyName,
            creditScore: creditRecord.creditScore,
            creditLimit: creditRecord.creditLimit,
            remarks: creditRecord.remarks,
            lastUpdated: creditRecord.lastUpdated,
          },
        }),
      },
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        creditScore: invoice.creditScore,
        creditCheckedAt: invoice.creditCheckedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/invoices/admin/all   (bonus — admin dashboard)
// @desc    Admin fetches all invoices with full filters
// @access  Private — Admin only
// ─────────────────────────────────────────────────────────────
const getAllInvoicesAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.fbrStatus) filter.fbrStatus = req.query.fbrStatus;
    if (req.query.creditScore) filter.creditScore = req.query.creditScore;
    if (req.query.ntn) filter.ntn = req.query.ntn;
    if (req.query.anchorCompany) {
      filter.anchorCompany = { $regex: req.query.anchorCompany, $options: 'i' };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('smeId', 'name email businessName ntn')
        .select('-documents'),
      Invoice.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitInvoice,
  getMyInvoices,
  getAllVerified,
  getById,
  approveInvoice,
  rejectInvoice,
  fbrCheck,
  creditCheck,
  getAllInvoicesAdmin,
};
