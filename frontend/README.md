# FactorOne — Admin Pages

## Files Included

```
src/pages/admin/
├── AdminDashboard.js       — Stats, line chart, recent invoices + users tables
├── InvoiceQueue.js         — Full invoice table with status filters & pagination
├── AdminInvoiceDetail.js   — Invoice review with FBR check, credit score, approve/reject
└── UserManagement.js       — User table with activate/block actions & toast feedback
```

## Dependencies

```bash
npm install react-router-dom recharts lucide-react
```

## Routing Setup

Add these routes to your existing router (e.g. `src/App.js`):

```jsx
import AdminDashboard     from "./pages/admin/AdminDashboard";
import InvoiceQueue       from "./pages/admin/InvoiceQueue";
import AdminInvoiceDetail from "./pages/admin/AdminInvoiceDetail";
import UserManagement     from "./pages/admin/UserManagement";

// Inside your <Routes>:
<Route path="/admin/dashboard"        element={<AdminDashboard />}     />
<Route path="/admin/invoices"         element={<InvoiceQueue />}       />
<Route path="/admin/invoices/:id"     element={<AdminInvoiceDetail />} />
<Route path="/admin/users"            element={<UserManagement />}     />
```

## API Endpoints

| Method | Endpoint                            | Used In               |
|--------|-------------------------------------|-----------------------|
| GET    | /api/admin/stats                    | AdminDashboard        |
| GET    | /api/admin/invoices                 | InvoiceQueue          |
| GET    | /api/admin/invoices/:id             | AdminInvoiceDetail    |
| GET    | /api/invoices/:id/fbr-check         | AdminInvoiceDetail    |
| GET    | /api/invoices/:id/credit-check      | AdminInvoiceDetail    |
| PATCH  | /api/invoices/:id/approve           | AdminInvoiceDetail    |
| PATCH  | /api/invoices/:id/reject            | AdminInvoiceDetail    |
| GET    | /api/admin/users                    | UserManagement        |
| PATCH  | /api/admin/users/:id/activate       | UserManagement        |
| PATCH  | /api/admin/users/:id/block          | UserManagement        |

All pages fall back to built-in mock data when the API is unavailable.

## Theme

- Background: `#0f172a`
- Cards:       `#1e293b`
- Accent:      `#3b82f6`
