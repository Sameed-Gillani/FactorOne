const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const Notification = require("../models/Notification");

// GET /api/notifications — get all notifications for logged-in user
router.get("/", protect, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const skip  = (page - 1) * limit;

    const [notifications, total, unread] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({ success: true, unread, total, notifications });
  } catch (err) { next(err); }
});

// GET /api/notifications/unread-count — just the count (for navbar badge)
router.get("/unread-count", protect, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", protect, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read — mark single as read
router.patch("/:id/read", protect, async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found." });
    res.json({ success: true, notification: notif });
  } catch (err) { next(err); }
});

module.exports = router;
