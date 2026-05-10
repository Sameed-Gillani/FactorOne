const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const path = require("path");

// ─── Route Imports ───────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
// Add your other route imports here, e.g.:
// const userRoutes = require("./routes/userRoutes");
// const walletRoutes = require("./routes/walletRoutes");

const app = express();

// ─── Trust Proxy (required for express-rate-limit behind nginx/load balancer) ─
app.set("trust proxy", 1);

// ─── Security Headers via Helmet ─────────────────────────────────────────────
app.use(
  helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // HTTP Strict Transport Security – 1 year
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // Prevent MIME-type sniffing
    noSniff: true,
    // Prevent clickjacking
    frameguard: { action: "deny" },
    // Remove X-Powered-By
    hidePoweredBy: true,
    // XSS protection (legacy browsers)
    xssFilter: true,
    // Referrer policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Disable IE8 download prompts for IE8
    ieNoOpen: true,
    // Prevent DNS prefetch
    dnsPrefetchControl: { allow: false },
    // Cross-Origin policies
    crossOriginEmbedderPolicy: false, // Set true if you don't embed cross-origin resources
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24h preflight cache
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────
// Strips $ and . from request body, query, and params
app.use(
  mongoSanitize({
    replaceWith: "_",        // Replace prohibited chars instead of removing
    onSanitize: ({ req, key }) => {
      console.warn(
        `[SECURITY] Mongo injection attempt blocked — key: "${key}" | IP: ${req.ip} | Path: ${req.path}`
      );
    },
  })
);

// ─── Global Rate Limiter: 100 requests per 15 minutes ─────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,                    // limit each IP to 100 requests per window
  standardHeaders: true,       // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,        // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
  handler: (req, res, next, options) => {
    console.warn(
      `[RATE LIMIT] Global limit hit — IP: ${req.ip} | Path: ${req.path}`
    );
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health" || req.path === "/";
  },
});

app.use(globalLimiter);

// ─── Static Files – Uploads ───────────────────────────────────────────────────
// Serve uploaded files (restrict to authenticated routes in production)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/wallet", walletRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;

  // Don't leak stack traces in production
  const response = {
    success: false,
    message: err.message || "An unexpected error occurred.",
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  console.error(`[ERROR] ${status} — ${err.message} | Path: ${req.path}`);
  res.status(status).json(response);
});

// ─── Database Connection ──────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("[DB] MongoDB connected successfully");
  } catch (err) {
    console.error("[DB] Connection failed:", err.message);
    process.exit(1);
  }
};

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[SERVER] FactorOne API running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  });
};

startServer();

module.exports = app; // Export for testing
