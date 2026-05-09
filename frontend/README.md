# FactorOne – Wallet & Notifications Pages

## Files

| File | Destination in your project |
|------|------------------------------|
| `src/pages/shared/WalletPage.js` | `src/pages/shared/WalletPage.js` |
| `src/pages/shared/NotificationsPage.js` | `src/pages/shared/NotificationsPage.js` |
| `src/components/Navbar.js` | `src/components/Navbar.js` |

## Setup

1. Copy files into your React project at the paths above.

2. Add routes in your router (React Router v6 example):
```jsx
import WalletPage from "./pages/shared/WalletPage";
import NotificationsPage from "./pages/shared/NotificationsPage";

<Route path="/wallet" element={<WalletPage />} />
<Route path="/notifications" element={<NotificationsPage />} />
```

3. Make sure `REACT_APP_API_URL` is set in your `.env` (or leave blank for same-origin):
```
REACT_APP_API_URL=https://your-api-domain.com
```

4. Auth token must be stored in `localStorage` under key `"token"`.
   User object (with `role`, `firstName`, `lastName`, `email`) stored under `"user"`.

## API Endpoints Used

### WalletPage
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/wallet` | — |
| GET | `/api/wallet/transactions?page=&limit=` | — |
| POST | `/api/wallet/topup` | `{ amount: number }` |
| POST | `/api/wallet/withdraw` | `{ amount: number }` |

### NotificationsPage
| Method | Endpoint | Body |
|--------|----------|------|
| GET | `/api/notifications?page=&limit=&type=` | — |
| PUT | `/api/notifications/read-all` | — |
| PUT | `/api/notifications/:id/read` | — |

### Navbar (polling)
| Method | Endpoint |
|--------|----------|
| GET | `/api/notifications/unread-count` |

Expected response: `{ count: number }` or `{ unreadCount: number }`

## Transaction Types & Colors

| Type | Color |
|------|-------|
| `topup` | 🟢 Green |
| `investment` | 🔴 Red |
| `disbursement` | 🔵 Blue |
| `withdrawal` | 🟠 Orange |

## Notification Types & Colors

| Type | Color |
|------|-------|
| `transaction` | 🟢 Green |
| `system` | 🔵 Blue |
| `approval` | 🟡 Amber |

## Role-based Navbar Links

Edit the `NAV_LINKS` object in `Navbar.js` to adjust navigation per role (`admin`, `investor`, `borrower`).
