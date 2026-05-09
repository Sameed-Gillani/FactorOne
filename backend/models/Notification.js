const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    type: {
      type: String,
      enum: [
        'account_approved',
        'account_blocked',
        'invoice_submitted',
        'invoice_approved',
        'invoice_rejected',
        'bid_placed',
        'bid_accepted',
        'bid_rejected',
        'payment_received',
        'payment_due',
        'wallet_credited',
        'wallet_debited',
        'kyc_required',
        'system',
      ],
      default: 'system',
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    link: {
      type: String,
      trim: true,
      default: null,
      comment: 'Optional frontend route to navigate when tapped',
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      comment: 'Any extra contextual data (invoiceId, amount, etc.)',
    },
  },
  {
    timestamps: true,
  }
);

// ── Instance method: mark as read ───────────────────────────
notificationSchema.methods.markRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// ── Static: mark all notifications read for a user ──────────
notificationSchema.statics.markAllRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// ── Static: create and send a notification ───────────────────
notificationSchema.statics.send = async function ({ recipient, title, message, type, link, metadata }) {
  return this.create({ recipient, title, message, type: type || 'system', link, metadata });
};

// ── Indexes ──────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
