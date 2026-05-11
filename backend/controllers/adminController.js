const User = require("../models/User");
const Invoice = require("../models/Invoice");
const Wallet = require("../models/Wallet");
const Investment = require("../models/Investment");
const Notification = require("../models/Notification");

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -__v").sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while fetching users" });
  }
};

// PATCH /api/admin/users/:id/activate
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.status = "active";
    await user.save();
    await Notification.create({
      recipient: user._id,
      type: "account_activated",
      title: "Account Activated",
      message: "Your FactorOne account has been activated. You can now access all platform features.",
      isRead: false,
    });
    res.status(200).json({ success: true, message: `User ${user.email} activated`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while activating user" });
  }
};

// PATCH /api/admin/users/:id/block
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ success: false, message: "Admin accounts cannot be blocked" });
    user.status = "blocked";
    await user.save();
    res.status(200).json({ success: true, message: `User ${user.email} blocked`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while blocking user" });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [
      totalUsers, pendingUsers, activeUsers, blockedUsers,
      totalInvoices, pendingInvoices, verifiedInvoices, fundedInvoices, rejectedInvoices,
      investmentAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "pending" }),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "blocked" }),
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: "pending" }),
      Invoice.countDocuments({ status: "verified" }),
      Invoice.countDocuments({ status: "funded" }),
      Invoice.countDocuments({ status: "rejected" }),
      Investment.aggregate([{ $group: { _id: null, totalVolume: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("name email role status createdAt");
    const recentInvoices = await Invoice.find().sort({ createdAt: -1 }).limit(5)
      .populate("smeId", "name businessName").select("invoiceNumber anchorCompany amountPkr status createdAt");

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, pending: pendingUsers, active: activeUsers, blocked: blockedUsers },
        invoices: { total: totalInvoices, pending: pendingInvoices, verified: verifiedInvoices, funded: fundedInvoices, rejected: rejectedInvoices },
        investments: { total: investmentAgg[0]?.count || 0, totalVolume: investmentAgg[0]?.totalVolume || 0 },
        recentUsers,
        recentInvoices,
      },
    });
  } catch (error) {
    console.error("getStats error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching stats" });
  }
};

module.exports = { getAllUsers, activateUser, blockUser, getStats };
