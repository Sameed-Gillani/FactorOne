const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── protect ──────────────────────────────────────────────────────────────────
// Verifies JWT and attaches req.user.
// Password and sensitive fields are never returned here (select: false on schema).
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header (Bearer) or cookie
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Fetch user — password excluded by default (select: false)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Please contact support.",
      });
    }

    req.user = { id: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch (err) {
    console.error("[AUTH MIDDLEWARE] protect error:", err);
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};

// ─── authorize ────────────────────────────────────────────────────────────────
// Role-based access control. Call after protect.
// Usage: authorize("admin", "investor")
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${roles.join(", ")}.`,
      });
    }
    next();
  };
};
