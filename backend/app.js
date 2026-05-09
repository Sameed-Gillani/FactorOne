const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();

// ── Security headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Request logging ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── NoSQL injection sanitisation ─────────────────────────────
app.use(mongoSanitize());

// ── Global rate limiter ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', globalLimiter);

// ── Auth-specific rate limiter ────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Static files ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FactorOne API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    routes: [
      'POST   /api/auth/register',
      'POST   /api/auth/login',
      'GET    /api/auth/me',
      'POST   /api/invoices',
      'GET    /api/invoices/my',
      'GET    /api/invoices',
      'GET    /api/invoices/:id',
      'PATCH  /api/invoices/:id/approve',
      'PATCH  /api/invoices/:id/reject',
      'GET    /api/invoices/:id/fbr-check',
      'GET    /api/invoices/:id/credit-check',
      'POST   /api/investments',
      'GET    /api/investments/my',
      'GET    /api/wallet',
      'POST   /api/wallet/topup',
      'POST   /api/wallet/withdraw',
    ],
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/wallet', walletRoutes);

// ── 404 handler ──────────────────────────────────────────────
app.use(notFound);

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
