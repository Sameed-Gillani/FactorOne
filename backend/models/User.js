const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const UserSchema = new mongoose.Schema(
  {
    name:  { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
    phone: { type: String, trim: true, default: "" },
    cnic:  { type: String, trim: true, default: "" },
    password: { type: String, required: [true, "Password is required"], minlength: 8, select: false },
    role:   { type: String, enum: ["admin", "investor", "sme"], default: "investor" },
    status: { type: String, enum: ["pending", "active", "blocked"], default: "pending" },
    // SME-specific
    businessName: { type: String, trim: true, default: "" },
    ntn:          { type: String, trim: true, default: "" },
    sector:       { type: String, trim: true, default: "" },
    // Investor-specific
    city:            { type: String, trim: true, default: "" },
    experienceLevel: { type: String, trim: true, default: "" },
    // Auth security
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil:     { type: Date, default: null },
    otpCode:       { type: String, select: false, default: null },
    otpExpires:    { type: Date,   select: false, default: null },
    lastLoginAt:   { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password; delete ret.loginAttempts; delete ret.lockUntil;
        delete ret.otpCode; delete ret.otpExpires; delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({ $set: { loginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } });
};

UserSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select("+password +loginAttempts +lockUntil");
};

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ cnic: 1 }, { sparse: true });

const User = mongoose.model("User", UserSchema);
module.exports = User;
module.exports.MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS;
module.exports.LOCK_DURATION_MS = LOCK_DURATION_MS;
