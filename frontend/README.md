# FactorOne — Investor Pages

## Files Included

```
src/pages/investor/
├── InvestorDashboard.js   — Dashboard with stats, investments table, monthly bar chart
├── Marketplace.js         — Invoice marketplace with sector/duration filters, 3-col card grid
├── InvoiceDetail.js       — Full invoice detail + Yield Calculator + Invest modal
└── MyInvestments.js       — Full investments table with sort, filter, export
```

## Dependencies

All pages use packages already common in React apps:
- `react-router-dom` — navigation (`useNavigate`, `useParams`)
- `recharts` — bar chart in InvestorDashboard
- `lucide-react` — icons throughout

Install if not present:
```bash
npm install react-router-dom recharts lucide-react
```

## Routing Setup

Add these routes to your existing router (e.g. `src/App.js`):

```jsx
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import Marketplace       from "./pages/investor/Marketplace";
import InvoiceDetail     from "./pages/investor/InvoiceDetail";
import MyInvestments     from "./pages/investor/MyInvestments";

// Inside your <Routes>:
<Route path="/investor/dashboard"          element={<InvestorDashboard />} />
<Route path="/investor/marketplace"        element={<Marketplace />} />
<Route path="/investor/invoice/:id"        element={<InvoiceDetail />} />
<Route path="/investor/my-investments"     element={<MyInvestments />} />
```

## API Endpoints Expected

| Method | Endpoint            | Used In                        |
|--------|---------------------|--------------------------------|
| GET    | /api/invoices       | Marketplace (with ?sector=&duration= query params) |
| GET    | /api/invoices/:id   | InvoiceDetail                  |
| POST   | /api/investments    | InvoiceDetail (confirm invest) |
| GET    | /api/investments    | MyInvestments                  |

All pages fall back to built-in mock data when the API is unavailable,
so they work out-of-the-box without a backend.

## Theme

Matches FactorOne dark theme:
- Background: `#0f172a`
- Cards:       `#1e293b`
- Accent:      `#3b82f6`
