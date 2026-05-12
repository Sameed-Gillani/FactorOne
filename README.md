# FactorOne — SME Invoice Discounting Marketplace

Built with the MERN stack: MongoDB, Express.js, React, Node.js.

FactorOne is a web platform where Pakistani SMEs can upload unpaid invoices and get them funded by investors. SMEs get cash without waiting 60–90 days. Investors earn returns on short-duration investments backed by corporate payment obligations.

---

## Project Structure

```
FactorOne Final Project/
├── backend/      Node.js + Express REST API
└── frontend/     React + Vite + Tailwind CSS
```

---

## Running Locally

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

Runs on `http://localhost:5000`

The seed command creates three demo accounts and loads mock FBR and credit score data into MongoDB. Run it once after setting up your `.env` file.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

Make sure your `.env` file has `VITE_API_URL=http://localhost:5000/api` before starting.

---

## Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@factorone.pk | Admin@123 |
| SME | sme@factorone.pk | Sme@12345 |
| Investor | investor@factorone.pk | Investor@123 |

New accounts registered through the app start with `pending` status. An admin needs to activate them before they can log in.

---

## Features

**Authentication**
- JWT-based login with role detection (SME, Investor, Admin)
- Passwords hashed with bcrypt
- Account locks after 5 failed login attempts
- OTP-based password reset via email

**SME Portal**
- Submit invoices with drag-and-drop file upload
- Tesseract.js OCR reads invoice images and auto-fills the form
- Track invoice status: Pending, Verified, Funded, Rejected
- Wallet with incoming disbursements and withdrawal

**Investor Portal**
- Browse verified invoices on the marketplace
- Filter by sector, yield, and duration
- Yield calculator shows expected return before investing
- One-click investment with wallet balance check
- Portfolio dashboard with total invested and expected returns

**Admin Panel**
- Approve or reject invoices with a mandatory written note
- FBR NTN check against mock database
- Automatic credit score lookup for anchor companies
- User management — activate or block accounts
- Platform statistics dashboard

**Security**
- Helmet for HTTP headers
- express-mongo-sanitize against NoSQL injection
- Rate limiting on login and register endpoints
- Role middleware on every protected route
- File uploads restricted to JPG, PNG, PDF under 5MB
- Sensitive config stored in environment variables only

---

## API Endpoints

| Method | Endpoint | Who can use |
|--------|----------|-------------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/forgot-password | Public |
| POST | /api/auth/reset-password | Public |
| GET | /api/auth/me | Any logged-in user |
| POST | /api/invoices | SME |
| GET | /api/invoices/my | SME |
| GET | /api/invoices/marketplace | Investor |
| GET | /api/invoices/admin/all | Admin |
| PATCH | /api/invoices/:id/approve | Admin |
| PATCH | /api/invoices/:id/reject | Admin |
| GET | /api/invoices/:id/fbr-check | Admin |
| GET | /api/invoices/:id/credit-check | Admin |
| POST | /api/investments | Investor |
| GET | /api/investments/my | Investor |
| GET | /api/wallet | Any logged-in user |
| POST | /api/wallet/topup | Any logged-in user |
| POST | /api/wallet/withdraw | Any logged-in user |
| GET | /api/admin/users | Admin |
| PATCH | /api/admin/users/:id/activate | Admin |
| PATCH | /api/admin/users/:id/block | Admin |
| GET | /api/admin/stats | Admin |

---

## Deployment

**Backend on Render:**
1. Push the `backend` folder to GitHub
2. Create a new Web Service on render.com
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from your `.env`
7. After first deploy, open the Render shell and run `npm run seed`

**Frontend on Vercel:**
1. Push the `frontend` folder to GitHub
2. Create a new project on vercel.com
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-render-app.onrender.com/api`
5. Deploy and copy the Vercel URL
6. Go back to Render and add `FRONTEND_URL` with your Vercel URL, then redeploy

---

Student: Sameed Gillani — 23I-5554
Course: Web Programming FT06-A