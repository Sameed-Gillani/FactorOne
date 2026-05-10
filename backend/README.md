# FactorOne — Security Hardening

Complete security hardening for the FactorOne Node.js/Express backend.

---

## Files Changed / Created

| File | Type | What changed |
|------|------|-------------|
| `app.js` | Updated | `helmet()`, `express-mongo-sanitize()`, global rate limiter (100 req/15 min) |
| `models/User.js` | Updated | `password` → `select: false`, `loginAttempts` field, `lockUntil` field, instance methods |
| `controllers/authController.js` | Updated | Lockout logic, attempt counter, unlock time in error message, password never returned |
| `routes/authRoutes.js` | Updated | Strict login rate limiter (5 req/15 min on `/login` only) |
| `middlewares/uploadMiddleware.js` | **Created** | Multer, UUID rename, type filter, magic bytes check, 5 MB cap |
| `controllers/invoiceController.js` | Updated | Uses `uploadSingle` / `uploadOptional` middleware, file cleanup on error |
| `routes/invoiceRoutes.js` | Updated | Wires upload middleware into POST/PUT invoice routes |
| `middlewares/authMiddleware.js` | Reference | JWT protect + RBAC authorize (included for completeness) |
| `models/Invoice.js` | Reference | Invoice schema with embedded file sub-document |

---

## Installation

```bash
npm install
```

### Required `.env` variables

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/factorone
JWT_SECRET=your-very-long-random-secret-here
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://your-frontend.com,https://app.your-frontend.com
```

---

## Security Features

### 1. Helmet — Security Headers (`app.js`)
- **Content-Security-Policy** — restricts resource origins
- **HSTS** — forces HTTPS for 1 year with preload
- **X-Content-Type-Options: nosniff** — prevents MIME sniffing
- **X-Frame-Options: DENY** — blocks clickjacking
- **Referrer-Policy** — limits referrer leakage
- **X-Powered-By** removed — hides Express fingerprint

### 2. NoSQL Injection Prevention (`app.js`)
`express-mongo-sanitize` strips `$` and `.` characters from `req.body`, `req.query`, and `req.params`, neutralising MongoDB operator injection attacks like:
```json
{ "email": { "$gt": "" }, "password": { "$gt": "" } }
```
Logs a warning for every blocked attempt.

### 3. Global Rate Limiter (`app.js`)
- **100 requests per IP per 15 minutes**
- Returns `429` with `RateLimit-*` standard headers
- Skips `/health` endpoint
- Logs when limit is hit

### 4. Login Rate Limiter (`routes/authRoutes.js`)
- **5 requests per IP per 15 minutes** on `POST /api/auth/login` only
- Independent of global limiter (uses `keyGenerator: "login:<ip>"`)
- Logs masked email on breach

### 5. Account Lockout (`models/User.js` + `controllers/authController.js`)

| Event | Action |
|-------|--------|
| Failed login | `loginAttempts++` |
| 5th failed attempt | `lockUntil = now + 15 minutes` |
| Locked account login | `423 Locked` + exact time remaining |
| Successful login | `loginAttempts = 0`, `lockUntil` unset |
| Lock expired, new attempt | Counter resets to 1 |

Error response when locked:
```json
{
  "success": false,
  "message": "Your account is temporarily locked due to too many failed login attempts. Please try again in 12 minutes and 43 seconds.",
  "lockedUntil": "2024-01-15T10:30:00.000Z",
  "timeRemaining": "12 minutes and 43 seconds"
}
```

### 6. Password Never Exposed (`models/User.js`)
```js
password: { type: String, select: false }
```
- Password is **never** returned by any `find`, `findOne`, or population query by default
- `toJSON` transform also strips it as a second layer of defence
- Only `User.findByEmailWithPassword()` opts in with `.select("+password")` — used exclusively in `authController.login` and `changePassword`

### 7. File Upload Security (`middlewares/uploadMiddleware.js`)

| Layer | Protection |
|-------|-----------|
| `fileFilter` | Rejects non-JPG/PNG/PDF MIME types before disk write |
| `limits.fileSize` | Hard 5 MB cap enforced by multer |
| UUID rename | `uuidv4() + ext` — eliminates path traversal via filename |
| Magic bytes check | Reads first 8 bytes to verify actual file signature |
| Cleanup on failure | Orphaned files deleted on any validation error |

Upload field name: **`invoiceFile`**

```
POST /api/invoices
Content-Type: multipart/form-data

invoiceFile: <file>   ← jpg / png / pdf, max 5 MB
title: "Invoice #42"
amount: 5000
```

---

## Rate Limit Reference

| Route | Limit | Window |
|-------|-------|--------|
| All routes | 100 req | 15 min |
| `POST /api/auth/login` | 5 req | 15 min |
| `POST /api/auth/register` | 10 req | 1 hour |
| Password reset | 3 req | 1 hour |

---

## Admin: Unlock Account

```
PUT /api/auth/unlock/:userId
Authorization: Bearer <admin-token>
```

---

## Drop-in Instructions

1. Copy files into your project at the same relative paths.
2. Run `npm install` to install new dependencies.
3. Ensure `.env` contains all required variables.
4. If you had an existing `uploads/` folder, it will continue to work — new uploads use UUID names.
5. Existing users without `loginAttempts` / `lockUntil` fields will default to `0` / `null` automatically (Mongoose default values).
