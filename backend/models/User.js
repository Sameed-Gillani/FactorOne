const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const UserSchema = new mongoose.Schema(
  {
    // ─── Identity ──────────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    // ─── Auth ──────────────────────────────────────────────────────────────
    // select: false ensures password is NEVER returned in any query by default.
    // You must explicitly opt-in with .select("+password") when you need it.
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    // ─── Role ──────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["admin", "investor", "borrower"],
      default: "investor",
    },

    // ─── Account Status ────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // ─── Brute-Force / Account Lock ────────────────────────────────────────
    // Tracks consecutive failed login attempts.
    loginAttempts: {
      type: Number,
      required: true,
      default: 0,
    },
    // When set and in the future, the account is locked.
    lockUntil: {
      type: Date,
      default: null,
    },

    // ─── Profile ───────────────────────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
      country: { type: String, trim: true },
    },

    // ─── Wallet ────────────────────────────────────────────────────────────
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Timestamps ────────────────────────────────────────────────────────
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: {
      // Remove sensitive fields when converting to JSON
      transform(doc, ret) {
        delete ret.password;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Virtual: isLocked ────────────────────────────────────────────────────────
// Returns true if the account is currently locked.
UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Pre-Save Hook: Hash Password ─────────────────────────────────────────────
UserSchema.pre("save", async function (next) {
  // Only hash if password was modified (or is new)
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance Method: Compare Password ───────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance Method: Increment Login Attempts ───────────────────────────────
// Call on every failed login attempt.
UserSchema.methods.incLoginAttempts = async function () {
  // If a previous lock has expired, restart at 1 attempt
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account on reaching MAX_LOGIN_ATTEMPTS
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }

  return this.updateOne(updates);
};

// ─── Instance Method: Reset Login Attempts ───────────────────────────────────
// Call on successful login.
UserSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLoginAt: new Date() },
    $unset: { lockUntil: 1 },
  });
};

// ─── Static Method: Find by Email with Password ──────────────────────────────
// Used exclusively in auth flows where password comparison is needed.
UserSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select(
    "+password +loginAttempts +lockUntil"
  );
};

// ─── Indexes ─────────────────────────────────────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ lockUntil: 1 }, { sparse: true }); // For cleanup jobs

const User = mongoose.model("User", UserSchema);

module.exports = User;
module.exports.MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS;
module.exports.LOCK_DURATION_MS = LOCK_DURATION_MS;
