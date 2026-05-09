const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');

// ── Helper ────────────────────────────────────────────────────
const formatValidationErrors = (errors) =>
  errors.array().map((e) => ({ field: e.path, message: e.msg }));

// ─────────────────────────────────────────────────────────────
// @route   POST /api/investments
// @desc    Investor places an investment on a verified invoice
// @access  Private — Investor, active account
// ─────────────────────────────────────────────────────────────
const placeInvestment = async (req, res, next) => {
  // Use a Mongoose session for atomicity — if anything fails, everything rolls back
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    }

    const { invoiceId, amount } = req.body;
    const investorId = req.user._id;

    // 2. Fetch invoice (lock within session)
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // 3. Invoice must be verified (approved by admin) to accept investments
    if (invoice.status !== 'verified') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `This invoice is not open for investment. Current status: '${invoice.status}'.`,
      });
    }

    // 4. Check for overfunding — investment cannot exceed remaining amount
    const remainingAmount = invoice.amountPkr - invoice.fundedAmount;
    if (remainingAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'This invoice is already fully funded.',
        remainingAmount: 0,
      });
    }

    if (amount > remainingAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Investment amount exceeds the remaining funding needed. Maximum you can invest: PKR ${remainingAmount.toLocaleString()}.`,
        remainingAmount,
      });
    }

    // 5. Fetch investor wallet (lock within session)
    const investorWallet = await Wallet.findOne({ user: investorId }).session(session);
    if (!investorWallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Investor wallet not found.' });
    }

    // 6. Check sufficient available balance
    const available = investorWallet.balance - investorWallet.frozenBalance;
    if (available < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: PKR ${available.toLocaleString()}, Required: PKR ${amount.toLocaleString()}.`,
        availableBalance: available,
        requiredAmount: amount,
      });
    }

    // 7. Deduct from investor wallet
    investorWallet.balance = parseFloat((investorWallet.balance - amount).toFixed(2));
    await investorWallet.save({ session });

    // 8. Record investor transaction (debit)
    const investorTx = await Transaction.record({
      walletId: investorWallet._id,
      userId: investorId,
      type: 'investment',
      amount,
      balanceAfter: investorWallet.balance,
      description: `Investment in invoice ${invoice.invoiceNumber} — ${invoice.anchorCompany}`,
      referenceId: invoice._id,
      referenceModel: 'Invoice',
      direction: 'debit',
    });

    // 9. Calculate expected return (investor earns the discount rate on their invested amount)
    const discountRate = invoice.discountRate || 3;
    const expectedReturn = parseFloat((amount * (discountRate / 100)).toFixed(2));
    const platformFeeRate = 3;
    const platformFeeAmount = parseFloat((expectedReturn * (platformFeeRate / 100)).toFixed(2));

    // 10. Create investment record
    const investment = await Investment.create(
      [
        {
          investorId,
          invoiceId: invoice._id,
          amount,
          expectedReturn,
          maturityDate: invoice.dueDate,
          platformFeeRate,
          platformFeeAmount,
          invoiceSnapshot: {
            invoiceNumber: invoice.invoiceNumber,
            anchorCompany: invoice.anchorCompany,
            amountPkr: invoice.amountPkr,
            discountRate: invoice.discountRate,
          },
        },
      ],
      { session }
    );

    // 11. Update invoice fundedAmount
    invoice.fundedAmount = parseFloat((invoice.fundedAmount + amount).toFixed(2));

    // 12. Check if invoice is now FULLY funded
    const isFullyFunded = invoice.fundedAmount >= invoice.amountPkr;

    if (isFullyFunded) {
      invoice.status = 'funded';
      invoice.fundedAt = new Date();

      // 13. Fetch SME wallet for disbursement
      const smeWallet = await Wallet.findOne({ user: invoice.smeId }).session(session);
      if (!smeWallet) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({ success: false, message: 'SME wallet not found for disbursement.' });
      }

      // 14. Calculate disbursement: invoice amount minus 3% platform fee
      const disbursementFeeRate = 3;
      const disbursementFee = parseFloat((invoice.amountPkr * (disbursementFeeRate / 100)).toFixed(2));
      const disbursementAmount = parseFloat((invoice.amountPkr - disbursementFee).toFixed(2));

      // 15. Credit SME wallet
      smeWallet.balance = parseFloat((smeWallet.balance + disbursementAmount).toFixed(2));
      await smeWallet.save({ session });

      // 16. Record SME disbursement transaction (credit)
      await Transaction.record({
        walletId: smeWallet._id,
        userId: invoice.smeId,
        type: 'disbursement',
        amount: disbursementAmount,
        balanceAfter: smeWallet.balance,
        description: `Disbursement for funded invoice ${invoice.invoiceNumber} (${disbursementFeeRate}% platform fee deducted)`,
        referenceId: invoice._id,
        referenceModel: 'Invoice',
        direction: 'credit',
        feeAmount: disbursementFee,
      });

      // 17. Notify SME of disbursement
      await Notification.send({
        recipient: invoice.smeId,
        title: '💰 Invoice Fully Funded — Funds Disbursed!',
        message: `Your invoice ${invoice.invoiceNumber} is fully funded. PKR ${disbursementAmount.toLocaleString()} has been credited to your wallet (after ${disbursementFeeRate}% platform fee of PKR ${disbursementFee.toLocaleString()}).`,
        type: 'payment_received',
        link: `/invoices/${invoice._id}`,
        metadata: {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          disbursementAmount,
          disbursementFee,
        },
      });
    }

    await invoice.save({ session });

    // 18. Notify investor of successful investment
    await Notification.send({
      recipient: investorId,
      title: '✅ Investment Placed Successfully',
      message: `You have invested PKR ${amount.toLocaleString()} in invoice ${invoice.invoiceNumber} (${invoice.anchorCompany}). Expected return: PKR ${expectedReturn.toLocaleString()} by ${new Date(invoice.dueDate).toLocaleDateString('en-PK')}.`,
      type: 'bid_placed',
      link: `/investments/${investment[0]._id}`,
      metadata: {
        investmentId: investment[0]._id,
        invoiceId: invoice._id,
        amount,
        expectedReturn,
      },
    });

    // 19. Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: isFullyFunded
        ? 'Investment placed successfully. Invoice is now fully funded and funds have been disbursed to the SME.'
        : 'Investment placed successfully.',
      investment: investment[0],
      invoiceStatus: invoice.status,
      fundedAmount: invoice.fundedAmount,
      remainingAmount: Math.max(0, invoice.amountPkr - invoice.fundedAmount),
      investorWalletBalance: investorWallet.balance,
      transactionId: investorTx._id,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/investments/my
// @desc    Investor fetches their own investments (paginated)
// @access  Private — Investor only
// ─────────────────────────────────────────────────────────────
const getMyInvestments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { investorId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [investments, total] = await Promise.all([
      Investment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'invoiceId',
          select: 'invoiceNumber anchorCompany amountPkr fundedAmount status dueDate discountRate creditScore fbrStatus',
        }),
      Investment.countDocuments(filter),
    ]);

    // Portfolio summary
    const summary = await Investment.aggregate([
      { $match: { investorId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalInvested: { $sum: '$amount' },
          totalExpectedReturn: { $sum: '$expectedReturn' },
        },
      },
    ]);

    const portfolioSummary = summary.reduce(
      (acc, item) => {
        acc[item._id] = {
          count: item.count,
          totalInvested: item.totalInvested,
          totalExpectedReturn: item.totalExpectedReturn,
        };
        acc.grandTotal.totalInvested += item.totalInvested;
        acc.grandTotal.totalExpectedReturn += item.totalExpectedReturn;
        acc.grandTotal.count += item.count;
        return acc;
      },
      { grandTotal: { count: 0, totalInvested: 0, totalExpectedReturn: 0 } }
    );

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
      portfolioSummary,
      investments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { placeInvestment, getMyInvestments };
