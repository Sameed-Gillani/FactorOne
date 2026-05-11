const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Notification = require("../models/Notification");

function generateToken(userId, role) {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function formatLockTime(lockUntil) {
  const ms = lockUntil - Date.now();
  if (ms <= 0) return "shortly";
  const mins = Math.floor(ms / 60000);
  const secs = Math.ceil((ms % 60000) / 1000);
  if (mins > 0) return `${mins} minute${mins !== 1 ? "s" : ""}`;
  return `${secs} second${secs !== 1 ? "s" : ""}`;
}

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, cnic, role, businessName, ntn, sector, city, experienceLevel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const assignedRole = ["investor", "sme"].includes(role) ? role : "investor";

    const userData = {
      name, email, password,
      phone: phone || "",
      cnic: cnic || "",
      role: assignedRole,
      status: "pending",
    };

    if (assignedRole === "sme") {
      userData.businessName = businessName || "";
      userData.ntn = ntn || "";
      userData.sector = sector || "";
    } else {
      userData.city = city || "";
      userData.experienceLevel = experienceLevel || "";
    }

    const user = await User.create(userData);

    // Create wallet for new user
    await Wallet.create({ user: user._id, balance: 0 });

    return res.status(201).json({
      success: true,
      message: "Account created. Please wait for admin approval before logging in.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }
    console.error("[AUTH] Register error:", err);
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${formatLockTime(user.lockUntil)}.`,
      });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await user.incLoginAttempts();
      const updated = await User.findByEmailWithPassword(email);
      if (updated?.isLocked) {
        return res.status(423).json({
          success: false,
          message: `Too many failed attempts. Account locked for 15 minutes.`,
        });
      }
      const left = Math.max(0, require("../models/User").MAX_LOGIN_ATTEMPTS - (updated?.loginAttempts || 0));
      return res.status(401).json({
        success: false,
        message: left > 0 ? `Invalid email or password. ${left} attempt${left !== 1 ? "s" : ""} remaining.` : "Invalid email or password.",
      });
    }

    if (user.status === "pending") {
      await user.resetLoginAttempts();
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval. You will be notified once approved.",
        status: "pending",
      });
    }

    await user.resetLoginAttempts();
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status,
              businessName: user.businessName, ntn: user.ntn, sector: user.sector, city: user.city, phone: user.phone, cnic: user.cnic },
    });
  } catch (err) {
    console.error("[AUTH] Login error:", err);
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch user." });
  }
};

// ─── Forgot Password (OTP) ────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return success to prevent email enumeration
    if (!user) return res.status(200).json({ success: true, message: "If that email exists, an OTP has been sent." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await User.findByIdAndUpdate(user._id, { otpCode: otp, otpExpires: expires });

    // Try to send email if nodemailer configured, otherwise log OTP
    try {
      const nodemailer = require("nodemailer");
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
          from: `"FactorOne" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "FactorOne — Password Reset OTP",
          html: `<div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px">
            <h2 style="color:#1e40af">Password Reset</h2>
            <p>Your one-time password is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1e40af;padding:16px;background:#eff6ff;border-radius:4px;text-align:center">${otp}</div>
            <p style="color:#64748b;font-size:14px">Valid for 5 minutes. Do not share this OTP.</p>
          </div>`,
        });
      }
    } catch (mailErr) {
      console.log("[OTP] Email send failed, OTP:", otp); // Dev fallback
    }

    console.log(`[OTP] Generated for ${email}: ${otp}`);
    return res.status(200).json({ success: true, message: "If that email exists, an OTP has been sent." });
  } catch (err) {
    console.error("[AUTH] forgotPassword error:", err);
    return res.status(500).json({ success: false, message: "Failed to process request." });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+otpCode +otpExpires");
    if (!user || !user.otpCode) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }
    if (user.otpExpires < Date.now()) {
      await User.findByIdAndUpdate(user._id, { otpCode: null, otpExpires: null });
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }
    if (user.otpCode !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    user.password = newPassword;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("[AUTH] resetPassword error:", err);
    return res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
    }
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return res.status(401).json({ success: false, message: "Current password is incorrect." });
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to change password." });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully." });
};
