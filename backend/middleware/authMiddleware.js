const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─────────────────────────────────────────────
// protect
// Validates the Bearer JWT in the Authorization header.
// Attaches the full user document (minus password) to req.user.
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorised — no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password -__v");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is valid but the associated user no longer exists",
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("protect middleware error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired — please log in again",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = { protect };
