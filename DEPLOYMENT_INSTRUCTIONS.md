# FactorOne Deployment Instructions

## STEP 1 — Deploy Backend on Render.com

1. Go to https://render.com and sign up free
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select your "FactorOne" repository
5. Configure:
   - Name: factorone-backend
   - Root Directory: backend
   - Environment: Node
   - Build Command: npm install
   - Start Command: node server.js
   - Plan: Free
6. Click "Advanced" → "Add Environment Variable" and add:
   - MONGO_URI = your MongoDB Atlas connection string
   - JWT_SECRET = factorone_super_secret_jwt_key_2024
   - NODE_ENV = production
   - PORT = 5000
   - FRONTEND_URL = (leave empty for now, add after Vercel deploy)
7. Click "Create Web Service"
8. Wait 3-5 minutes for deployment
9. Copy your Render URL (looks like: https://factorone-backend.onrender.com)

---

## STEP 2 — Deploy Frontend on Vercel

1. Go to https://vercel.com and sign up free
2. Click "New Project"
3. Import your GitHub "FactorOne" repository
4. Configure:
   - Root Directory: frontend
   - Framework Preset: Create React App
5. Click "Environment Variables" and add:
   - REACT_APP_API_URL = https://your-render-url.onrender.com/api
     (Replace with your actual Render URL from Step 1 + /api at the end)
6. Click "Deploy"
7. Wait 2-3 minutes
8. Copy your Vercel URL (looks like: https://factorone.vercel.app)

---

## STEP 3 — Connect Frontend URL to Backend

1. Go back to Render.com → your backend service
2. Click "Environment" tab
3. Update FRONTEND_URL = https://your-vercel-url.vercel.app
   (Replace with your actual Vercel URL from Step 2)
4. Click "Save Changes"
5. Render will auto-redeploy backend

---

## STEP 4 — Test Everything

1. Open your Vercel URL in browser
2. Register a new account
3. Go to MongoDB Atlas → Collections → users
4. Find your user → change role to "admin"
5. Log back in → you should see Admin dashboard

---

## STEP 5 — Share with Sir

Share these two URLs:
- Frontend: https://factorone.vercel.app
- Backend API: https://factorone-backend.onrender.com
- GitHub: https://github.com/Sameed-Gillani/FactorOne

---

## Common Issues

Problem: CORS error
Fix: Make sure FRONTEND_URL in Render matches exactly your Vercel URL

Problem: Cannot connect to MongoDB
Fix: Go to MongoDB Atlas → Network Access → Allow from anywhere (0.0.0.0/0)

Problem: White screen on Vercel
Fix: Make sure vercel.json is in the frontend folder and REACT_APP_API_URL is set correctly

Problem: Render backend sleeping (free tier)
Fix: First request after inactivity takes 30-60 seconds — this is normal on free tier
