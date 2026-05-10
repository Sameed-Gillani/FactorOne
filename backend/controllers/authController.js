const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function formatLockTime(lockUntil) {
  const ms = lockUntil - Date.now();
  if (ms <= 0) return "shortly";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0 && seconds > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} and ${seconds} second${seconds !== 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and password are required.",
      });
    }

    // Check for existing user
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Prevent self-assigning admin role
    const assignedRole = ["investor", "borrower"].includes(role) ? role : "investor";

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: assignedRole,
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    // Duplicate key error (race condition)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    console.error("[AUTH] Register error:", err);
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Basic Input Validation ──────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // ── Fetch user with sensitive fields needed for auth ────────────────────
    // Uses the static method that explicitly selects +password +loginAttempts +lockUntil
    const user = await User.findByEmailWithPassword(email);

    // ── User not found — generic message to prevent user enumeration ────────
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── Account disabled by admin ───────────────────────────────────────────
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Please contact support.",
      });
    }

    // ── Account lock check ──────────────────────────────────────────────────
    if (user.isLocked) {
      const timeRemaining = formatLockTime(user.lockUntil);
      return res.status(423).json({
        success: false,
        message: `Your account is temporarily locked due to too many failed login attempts. Please try again in ${timeRemaining}.`,
        lockedUntil: user.lockUntil,
        timeRemaining,
      });
    }

    // ── Password comparison ─────────────────────────────────────────────────
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment failed attempt counter (may set lockUntil)
      await user.incLoginAttempts();

      // Re-fetch to get updated loginAttempts count after increment
      const updatedUser = await User.findByEmailWithPassword(email);
      const attemptsLeft = Math.max(
        0,
        require("../models/User").MAX_LOGIN_ATTEMPTS - (updatedUser?.loginAttempts || 0)
      );

      // If now locked after this attempt
      if (updatedUser?.isLocked) {
        const timeRemaining = formatLockTime(updatedUser.lockUntil);
        return res.status(423).json({
          success: false,
          message: `Too many failed attempts. Your account has been locked for 15 minutes. Please try again in ${timeRemaining}.`,
          lockedUntil: updatedUser.lockUntil,
          timeRemaining,
        });
      }

      // Still has attempts remaining
      return res.status(401).json({
        success: false,
        message:
          attemptsLeft > 0
            ? `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining before account lockout.`
            : "Invalid email or password.",
      });
    }

    // ── Successful login — reset failed attempts ────────────────────────────
    await user.resetLoginAttempts();

    // ── Issue JWT ───────────────────────────────────────────────────────────
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[AUTH] Login error:", err);
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
// Requires auth middleware to set req.user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("[AUTH] getMe error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch user." });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    // Explicitly fetch password for verification
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("[AUTH] changePassword error:", err);
    return res.status(500).json({ success: false, message: "Failed to change password." });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
// JWT is stateless; logout is handled client-side by discarding the token.
// For token invalidation, implement a token blacklist (Redis) or use short-lived tokens.
exports.logout = (req, res) => {
  return res.status(200).json({ success: true, message: "Logged out successfully." });
};

// ─── Admin: Unlock Account ────────────────────────────────────────────────────
exports.unlockAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("+loginAttempts +lockUntil");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await user.updateOne({
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    });

    return res.status(200).json({ success: true, message: "Account unlocked successfully." });
  } catch (err) {
    console.error("[AUTH] unlockAccount error:", err);
    return res.status(500).json({ success: false, message: "Failed to unlock account." });
  }
};
