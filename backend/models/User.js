const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(\+92|0092|0)?[3][0-9]{9}$/, 'Please enter a valid Pakistani phone number'],
    },

    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      trim: true,
      match: [/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in format XXXXX-XXXXXXX-X'],
    },

    role: {
      type: String,
      enum: {
        values: ['sme', 'investor', 'admin'],
        message: 'Role must be sme, investor, or admin',
      },
      required: [true, 'Role is required'],
    },

    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'blocked'],
        message: 'Status must be pending, active, or blocked',
      },
      default: 'pending',
    },

    // ── SME-only fields ──────────────────────────────────────
    businessName: {
      type: String,
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
      required: [
        function () {
          return this.role === 'sme';
        },
        'Business name is required for SME accounts',
      ],
    },

    ntn: {
      type: String,
      trim: true,
      match: [/^\d{7}$/, 'NTN must be a 7-digit number'],
      required: [
        function () {
          return this.role === 'sme';
        },
        'NTN is required for SME accounts',
      ],
    },

    // ── Investor-only fields ─────────────────────────────────
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters'],
      required: [
        function () {
          return this.role === 'investor';
        },
        'City is required for investor accounts',
      ],
    },

    // ── Login-lockout fields ─────────────────────────────────
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    // ── Profile extras ───────────────────────────────────────
    profilePicture: {
      type: String,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: is account currently locked? ───────────────────
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// ── Pre-save hook: hash password ─────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare passwords ──────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: increment login attempts ────────────────
userSchema.methods.incLoginAttempts = async function () {
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;
  const lockMinutes = parseInt(process.env.LOCK_TIME_MINUTES, 10) || 30;

  // If a previous lock has expired, reset and start fresh
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account if we've hit the max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockMinutes * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// ── Instance method: reset login attempts on success ─────────
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

// ── Index ────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ cnic: 1 });
userSchema.index({ role: 1, status: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
