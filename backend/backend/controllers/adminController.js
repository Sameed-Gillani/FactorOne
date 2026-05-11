const User         = require("../models/User");
const Wallet       = require("../models/Wallet");
const Invoice      = require("../models/Invoice");
const Investment   = require("../models/Investment");
const Transaction  = require("../models/Transaction");
const Notification = require("../models/Notification");

// GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.role)   filter.role   = req.query.role;
    if (req.query.status) filter.status = req.query.status;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password -loginAttempts -lockUntil"),
      User.countDocuments(filter),
    ]);

    // Attach wallet balances
    const wallets = await Wallet.find({ user: { $in: users.map(u => u._id) } }).select("user balance frozenBalance");
    const walletMap = {};
    wallets.forEach(w => { walletMap[w.user.toString()] = w; });

    const usersWithWallets = users.map(u => ({
      ...u.toObject(),
      wallet: walletMap[u._id.toString()] || { balance: 0, frozenBalance: 0 },
    }));

    res.json({ success: true, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, users: usersWithWallets });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/activate
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    await Notification.send({
      recipient: user._id,
      title: "Account Approved ✅",
      message: "Your FactorOne account has been approved. You can now log in and use the platform.",
      type: "account_approved",
    });

    res.json({ success: true, message: "User activated.", user });
  } catch (err) { next(err); }
};

// PATCH /api/admin/users/:id/block
const blockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "blocked" },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    await Notification.send({
      recipient: user._id,
      title: "Account Suspended ❌",
      message: "Your account has been suspended. Please contact support@factorone.pk for assistance.",
      type: "system",
    });

    res.json({ success: true, message: "User blocked.", user });
  } catch (err) { next(err); }
};

// GET /api/admin/invoices
const getAllInvoices = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status)    filter.status    = req.query.status;
    if (req.query.fbrStatus) filter.fbrStatus = req.query.fbrStatus;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("smeId", "name email businessName ntn")
        .populate("approvedBy", "name")
        .populate("rejectedBy", "name"),
      Invoice.countDocuments(filter),
    ]);

    res.json({ success: true, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, invoices });
  } catch (err) { next(err); }
};

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [
      usersByRole,
      invoicesByStatus,
      investmentVolume,
      walletTotal,
      recentUsers,
      recentInvoices,
    ] = await Promise.all([
      // Users grouped by role
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      // Invoices grouped by status
      Invoice.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amountPkr" } } }]),
      // Total investment volume
      Investment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
      // Total platform wallet balance
      Wallet.aggregate([{ $group: { _id: null, totalBalance: { $sum: "$balance" } } }]),
      // Recently registered users (last 7 days)
      User.find({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("name email role status createdAt"),
      // Recent invoices (last 30 days for chart)
      Invoice.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amountPkr" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Reshape for easy frontend consumption
    const userCounts = usersByRole.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
    const invoiceCounts = invoicesByStatus.reduce((acc, r) => {
      acc[r._id] = { count: r.count, totalAmount: r.totalAmount };
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        users: {
          total: Object.values(userCounts).reduce((a, b) => a + b, 0),
          sme: userCounts.sme || 0,
          investor: userCounts.investor || 0,
          admin: userCounts.admin || 0,
        },
        invoices: {
          total: Object.values(invoiceCounts).reduce((a, c) => a + c.count, 0),
          pending:  invoiceCounts.pending  || { count: 0, totalAmount: 0 },
          verified: invoiceCounts.verified || { count: 0, totalAmount: 0 },
          funded:   invoiceCounts.funded   || { count: 0, totalAmount: 0 },
          rejected: invoiceCounts.rejected || { count: 0, totalAmount: 0 },
        },
        investments: {
          totalVolume: investmentVolume[0]?.total || 0,
          count: investmentVolume[0]?.count || 0,
        },
        platform: {
          totalWalletBalance: walletTotal[0]?.totalBalance || 0,
        },
        recentUsers,
        invoiceChart: recentInvoices,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { getAllUsers, activateUser, blockUser, getAllInvoices, getStats };
