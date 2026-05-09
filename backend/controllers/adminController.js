const User = require("../models/User");
const Invoice = require("../models/Invoice");
const Wallet = require("../models/Wallet");
const Notification = require("../models/Notification");

// ─────────────────────────────────────────────
// @desc    Get all users with wallet balances
// @route   GET /api/admin/users
// @access  Admin only
// ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -__v")
      .populate({
        path: "wallet",
        select: "balance currency lockedBalance totalDeposited totalWithdrawn",
      })
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Activate a user account
// @route   PATCH /api/admin/users/:id/activate
// @access  Admin only
// ─────────────────────────────────────────────
const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "active") {
      return res.status(400).json({
        success: false,
        message: "User is already active",
      });
    }

    user.status = "active";
    await user.save();

    // Send in-app notification to the user
    await Notification.create({
      recipient: user._id,
      type: "account_activated",
      title: "Account Activated",
      message:
        "Your FactorOne account has been activated. You can now access all platform features.",
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.email} has been activated successfully`,
      data: user,
    });
  } catch (error) {
    console.error("activateUser error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while activating user",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Block a user account
// @route   PATCH /api/admin/users/:id/block
// @access  Admin only
// ─────────────────────────────────────────────
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be blocked",
      });
    }

    if (user.status === "blocked") {
      return res.status(400).json({
        success: false,
        message: "User is already blocked",
      });
    }

    user.status = "blocked";
    await user.save();

    // Send in-app notification to the user
    await Notification.create({
      recipient: user._id,
      type: "account_blocked",
      title: "Account Suspended",
      message:
        "Your FactorOne account has been suspended. Please contact support for further assistance.",
      isRead: false,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.email} has been blocked successfully`,
      data: user,
    });
  } catch (error) {
    console.error("blockUser error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while blocking user",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all invoices with SME details
// @route   GET /api/admin/invoices
// @access  Admin only
// ─────────────────────────────────────────────
const getAllInvoices = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate({
          path: "sme",
          select:
            "fullName email phone companyName businessRegistrationNumber status role wallet",
          populate: {
            path: "wallet",
            select: "balance currency",
          },
        })
        .populate({
          path: "investors.investor",
          select: "fullName email role",
        })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: invoices,
    });
  } catch (error) {
    console.error("getAllInvoices error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching invoices",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Admin only
// ─────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Run all aggregations in parallel
    const [
      usersByRole,
      invoicesByStatus,
      investmentVolumeResult,
      walletBalanceResult,
      recentUsers,
      totalUsersCount,
      totalInvoicesCount,
    ] = await Promise.all([
      // Total users grouped by role
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),

      // Total invoices grouped by status
      Invoice.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),

      // Total investment volume (sum of all funded/completed invoice amounts)
      Invoice.aggregate([
        {
          $match: {
            status: { $in: ["funded", "completed", "repaid"] },
          },
        },
        {
          $group: {
            _id: null,
            totalVolume: { $sum: "$amount" },
            totalFunded: { $sum: "$fundedAmount" },
          },
        },
      ]),

      // Total wallet balance across the platform
      Wallet.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: "$balance" },
            totalLocked: { $sum: "$lockedBalance" },
            totalDeposited: { $sum: "$totalDeposited" },
            totalWithdrawn: { $sum: "$totalWithdrawn" },
            walletCount: { $sum: 1 },
          },
        },
      ]),

      // Recently registered users (last 7 days)
      User.find({ createdAt: { $gte: sevenDaysAgo } })
        .select("fullName email role status createdAt")
        .sort({ createdAt: -1 })
        .lean(),

      // Total user count
      User.countDocuments(),

      // Total invoice count
      Invoice.countDocuments(),
    ]);

    // Reshape usersByRole array into an object
    const userRoleSummary = usersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Reshape invoicesByStatus array into an object
    const invoiceStatusSummary = invoicesByStatus.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        totalAmount: item.totalAmount,
      };
      return acc;
    }, {});

    const investmentData = investmentVolumeResult[0] || {
      totalVolume: 0,
      totalFunded: 0,
    };

    const walletData = walletBalanceResult[0] || {
      totalBalance: 0,
      totalLocked: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      walletCount: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsersCount,
          byRole: userRoleSummary,
          recentlyRegistered: {
            count: recentUsers.length,
            periodDays: 7,
            users: recentUsers,
          },
        },
        invoices: {
          total: totalInvoicesCount,
          byStatus: invoiceStatusSummary,
        },
        investment: {
          totalVolume: investmentData.totalVolume,
          totalFunded: investmentData.totalFunded,
          currency: "USD",
        },
        wallets: {
          totalBalance: walletData.totalBalance,
          totalLockedBalance: walletData.totalLocked,
          totalDeposited: walletData.totalDeposited,
          totalWithdrawn: walletData.totalWithdrawn,
          activeWallets: walletData.walletCount,
          currency: "USD",
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("getStats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching stats",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  activateUser,
  blockUser,
  getAllInvoices,
  getStats,
};
