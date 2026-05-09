# FactorOne — Admin Module

Drop the files from this package into your existing project tree and follow the steps below.

---

## Files Delivered

```
controllers/
  adminController.js      ← getAllUsers, activateUser, blockUser,
                             getAllInvoices, getStats

routes/
  adminRoutes.js          ← all five admin routes, protected

middleware/
  authMiddleware.js       ← JWT protect (req.user population)
  adminMiddleware.js      ← adminOnly role guard

models/                   ← include only if you don't already have these
  User.js
  Wallet.js
  Invoice.js
  Notification.js
```

---

## 1 — Mount the router in app.js / server.js

```js
const adminRoutes = require("./routes/adminRoutes");

// Mount under /api/admin  — place AFTER body-parser / express.json()
app.use("/api/admin", adminRoutes);
```

---

## 2 — Required environment variables

```env
JWT_SECRET=your_super_secret_jwt_key
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/factorone
```

---

## 3 — User schema requirements

Your `User` document must have:

| Field    | Type     | Values                           |
|----------|----------|----------------------------------|
| `role`   | String   | `"admin"` \| `"sme"` \| `"investor"` |
| `status` | String   | `"pending"` \| `"active"` \| `"blocked"` |
| `wallet` | ObjectId | ref → `Wallet`                   |

---

## 4 — API Reference

### Users

| Method  | Endpoint                          | Description                        |
|---------|-----------------------------------|------------------------------------|
| GET     | `/api/admin/users`                | All users + wallet balances        |
| PATCH   | `/api/admin/users/:id/activate`   | Set status → active + notify       |
| PATCH   | `/api/admin/users/:id/block`      | Set status → blocked + notify      |

### Invoices

| Method  | Endpoint               | Description                              |
|---------|------------------------|------------------------------------------|
| GET     | `/api/admin/invoices`  | All invoices + SME details + investors   |

**Query params:** `status`, `page`, `limit`, `sortBy`, `order`

Example: `/api/admin/invoices?status=pending&page=1&limit=10&sortBy=createdAt&order=desc`

### Statistics

| Method  | Endpoint             | Description                |
|---------|----------------------|----------------------------|
| GET     | `/api/admin/stats`   | Full platform dashboard    |

**Stats response includes:**
- `users.total` — total user count
- `users.byRole` — `{ admin, sme, investor }` counts
- `users.recentlyRegistered` — last 7 days, full list
- `invoices.total` — total invoice count
- `invoices.byStatus` — count + totalAmount per status
- `investment.totalVolume` — sum of funded/completed/repaid invoice amounts
- `investment.totalFunded` — sum of fundedAmount across those invoices
- `wallets.totalBalance` — sum of all wallet balances
- `wallets.totalLockedBalance` — sum of all locked balances
- `wallets.totalDeposited` — cumulative platform deposits
- `wallets.totalWithdrawn` — cumulative platform withdrawals

---

## 5 — Authentication

All requests must include a valid JWT:

```
Authorization: Bearer <token>
```

The token payload must contain `{ id: "<userId>" }`.

---

## 6 — Dependencies

Already in a standard Express + Mongoose project — no extra installs needed:

```
express
mongoose
bcryptjs
jsonwebtoken
```
