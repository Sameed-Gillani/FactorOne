const express      = require("express");
const cors         = require("cors");
const morgan       = require("morgan");
const helmet       = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit    = require("express-rate-limit");
const path         = require("path");

const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const authRoutes         = require("./routes/authRoutes");
const invoiceRoutes      = require("./routes/invoiceRoutes");
const investmentRoutes   = require("./routes/investmentRoutes");
const walletRoutes       = require("./routes/walletRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:3000", "http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// ── Logging + Parsing ─────────────────────────────────────────
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());

// ── Rate limiting ─────────────────────────────────────────────
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
}));

// ── Static uploads ────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (_, res) =>
  res.json({ success: true, message: "FactorOne API running.", timestamp: new Date().toISOString() })
);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/invoices",      invoiceRoutes);
app.use("/api/investments",   investmentRoutes);
app.use("/api/wallet",        walletRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/notifications", notificationRoutes);

// ── Error handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
