# Deployment Instructions

## Before You Start

Make sure your code is pushed to GitHub. Both `backend` and `frontend` folders should be in the same repository.

Also go to MongoDB Atlas → Network Access → add `0.0.0.0/0` to allow connections from anywhere. Without this Render cannot connect to your database.

---

## Step 1 — Deploy Backend on Render

1. Go to render.com and create a free account
2. Click New → Web Service
3. Connect your GitHub account and select your FactorOne repository
4. Set these options:
   - Name: `factorone-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: Free
5. Click Advanced → Add Environment Variables and enter:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — `factorone_super_secret_jwt_key_2024`
   - `NODE_ENV` — `production`
   - `PORT` — `10000`
   - `FRONTEND_URL` — leave empty for now
6. Click Create Web Service
7. Wait 3-5 minutes for the first deploy to finish
8. Copy your Render URL — it looks like `https://factorone-backend.onrender.com`
9. Test it by opening `https://your-render-url.onrender.com/api/health` in the browser — it should return `{"status":"ok"}`

---

## Step 2 — Seed the Database

After the backend deploys successfully:

1. In Render dashboard → go to your backend service
2. Click the Shell tab
3. Run: `npm run seed`

This creates the three demo accounts (admin, SME, investor) and loads the mock FBR and credit score data.

---

## Step 3 — Deploy Frontend on Vercel

1. Go to vercel.com and create a free account
2. Click New Project → Import your FactorOne GitHub repository
3. Set Root Directory to `frontend`
4. Framework Preset will auto-detect as Vite — leave it
5. Under Environment Variables add:
   - `VITE_API_URL` — `https://your-render-url.onrender.com/api`
   - Replace with your actual Render URL from Step 1
6. Click Deploy
7. Wait 2-3 minutes
8. Copy your Vercel URL — it looks like `https://factorone.vercel.app`

---

## Step 4 — Connect Frontend URL to Backend

1. Go back to Render → your backend service → Environment tab
2. Set `FRONTEND_URL` to your Vercel URL from Step 3
3. Save Changes — Render will redeploy automatically

---

## Step 5 — Verify Everything Works

1. Open your Vercel URL
2. Landing page should load
3. Log in with: `admin@factorone.pk` / `Admin@123`
4. Check admin dashboard loads and stats show
5. Log out → log in as SME → submit a test invoice
6. Log in as admin → approve the invoice
7. Log in as investor → check marketplace shows the invoice

---

## Common Issues

**CORS error in browser console**
Make sure `FRONTEND_URL` in Render exactly matches your Vercel URL with no trailing slash.

**Cannot connect to MongoDB**
Go to MongoDB Atlas → Network Access → make sure `0.0.0.0/0` is in the IP whitelist.

**White screen on Vercel**
Check that `vercel.json` is in the frontend folder and `VITE_API_URL` is set correctly in Vercel environment variables.

**First request is slow (30-60 seconds)**
This is normal on Render's free tier. The server spins down after 15 minutes of inactivity and takes a moment to wake up again.

**Login not working after deploy**
Run `npm run seed` again from the Render shell to make sure demo accounts exist in the production database.

---

## Final URLs to Share

- Frontend: your Vercel URL
- Backend API: your Render URL + `/api`
- GitHub: https://github.com/Sameed-Gillani/FactorOne