const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required. Please log in." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Your session has expired. Please log in again." });
      }
      return res.status(401).json({ success: false, message: "Invalid authentication token." });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
    }

    req.user = { id: user._id.toString(), role: user.role, email: user.email, status: user.status };
    next();
  } catch (err) {
    console.error("[AUTH MIDDLEWARE] error:", err);
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. Required: ${roles.join(", ")}.` });
    }
    next();
  };
};
