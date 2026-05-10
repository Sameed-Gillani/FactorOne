# FactorOne — SME Dashboard (React + Tailwind Dark Theme)

Complete SME frontend module for the FactorOne invoice factoring platform.

---

## File Tree

```
src/
├── App.js                          ← Router + global styles + font
├── layouts/
│   └── SMELayout.js                ← Sidebar + Navbar shell (Outlet)
├── components/
│   ├── Sidebar.js                  ← Role-based collapsible sidebar
│   ├── Navbar.js                   ← Top bar: notifications bell + logout
│   ├── StatCard.js                 ← Reusable metric card with trend badge
│   ├── StatusBadge.js              ← Color-coded status pill
│   └── ProtectedRoute.js           ← Auth + role guard wrapper
├── pages/sme/
│   ├── SMEDashboard.js             ← 4 stat cards + recent invoice table
│   ├── SubmitInvoice.js            ← Drag-drop upload → Tesseract OCR → form
│   ├── MyInvoices.js               ← Full list with status filter pills
│   └── InvoiceDetail.js            ← Detail view + timeline + admin note
├── hooks/
│   ├── useAuth.js                  ← Login / logout / role helpers
│   └── useNotifications.js         ← Fetch + poll + mark-read notifications
└── utils/
    └── api.js                      ← Fetch wrapper with auto JWT headers
```

---

## Quick Start

### 1 — Install

```bash
npm install
```

### 2 — Environment

Create `.env` in the project root:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 3 — Run

```bash
npm start
```

---

## Integration Checklist

### API endpoints consumed

| Page / Hook            | Method | Endpoint                              |
|------------------------|--------|---------------------------------------|
| SMEDashboard           | GET    | `/api/invoices/my`                    |
| SubmitInvoice          | POST   | `/api/invoices`                       |
| MyInvoices             | GET    | `/api/invoices/my?status=<filter>`    |
| InvoiceDetail          | GET    | `/api/invoices/:id`                   |
| SMELayout (poll)       | GET    | `/api/notifications`                  |
| SMELayout              | PATCH  | `/api/notifications/:id/read`         |
| SMELayout              | PATCH  | `/api/notifications/read-all`         |
| useAuth.login          | POST   | `/api/auth/login`                     |

### Expected invoice shape (from API)

```json
{
  "_id": "abc123",
  "invoiceNumber": "INV-2024-001",
  "status": "pending",
  "amount": 500000,
  "fundedAmount": 0,
  "amountPkr": 500000,
  "issueDate": "2024-01-10T00:00:00.000Z",
  "dueDate": "2024-03-10T00:00:00.000Z",
  "createdAt": "2024-01-10T08:30:00.000Z",
  "debtor": { "name": "Anchor Corp Ltd" },
  "rejectionReason": "",
  "adminNotes": "",
  "documents": []
}
```

### Auth

Store JWT and user in localStorage after login:

```js
localStorage.setItem("token", jwt);
localStorage.setItem("user", JSON.stringify({ fullName, email, role }));
```

`role` must be `"sme"` for SME routes to pass the `ProtectedRoute` check.

---

## Design Tokens

| Token             | Value     | Usage                     |
|-------------------|-----------|---------------------------|
| Background        | `#0f172a` | Page / body               |
| Card surface      | `#1e293b` | All cards, panels         |
| Border            | `#334155` | Dividers, input borders   |
| Accent blue       | `#3b82f6` | Primary action, SME brand |
| Success green     | `#10b981` | Funded / active states    |
| Warning yellow    | `#f59e0b` | Pending states            |
| Danger red        | `#f87171` | Rejected / blocked        |
| Text primary      | `#f1f5f9` | Headings                  |
| Text secondary    | `#94a3b8` | Body copy                 |
| Text muted        | `#475569` | Labels, timestamps        |
| Font              | DM Sans   | All UI text               |

---

## StatusBadge Supported Statuses

`pending` · `approved` · `verified` · `under_review` · `funded` · `completed` · `repaid` · `rejected` · `blocked` · `overdue` · `active` · `processing`

---

## Tesseract OCR (SubmitInvoice)

Tesseract.js is loaded **dynamically** on first file upload — it is not bundled upfront. The OCR attempts to extract:

- Invoice number
- Anchor/buyer company name
- Amount (PKR/Rs)
- Issue date + due date
- NTN (7-digit)

All extracted fields are editable. Fields not detected remain blank for manual entry. The OCR badge (`OCR`) appears next to auto-filled field labels.

---

## Adding More Roles

`Sidebar.js` already contains nav configs for `sme`, `investor`, and `admin`. Add the corresponding `Layout` and `ProtectedRoute` wrapper in `App.js` following the same pattern.
