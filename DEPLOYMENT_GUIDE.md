# Deployment Guide: Frontend on AWS, Backend + DB + Redis for Free

This guide walks you through deploying:
- **Frontend** (Next.js) → **AWS Amplify**
- **Backend** (FastAPI) → **Render** (free)
- **PostgreSQL** → **Neon** (free)
- **Redis** → **Upstash** (free)

---

## Deploy backend on Render (do these in order)

Follow this order to avoid the “could not translate host name” and “no open ports” errors. **Use Neon for the database** (not Render’s PostgreSQL) so the connection URL works from Render’s servers.

### Step 1: Create the database (Neon)

1. Open **[neon.tech](https://neon.tech)** and sign up / log in.
2. Click **New Project**.
3. Project name: `messaging`. Region: e.g. **US East (N. Virginia)** or one close to you.
4. Click **Create project**.
5. On the project dashboard, find **Connection string** and choose **URI**.
6. Copy the full string. It looks like:
   ```text
   postgresql://your_user:your_password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
7. **Paste it into a note** — you’ll need it as `DATABASE_URL` on Render.  
   - If the string does **not** contain `?sslmode=require`, add it: `?sslmode=require` at the end.

### Step 2: Create Redis (Upstash)

1. Open **[upstash.com](https://upstash.com)** and sign up / log in.
2. Click **Create Database**.
3. Name: `messaging-redis`. Pick a **region** close to the one you chose for Neon.
4. Click **Create**.
5. Open the new database and find **REST URL** / **Redis URL**.
6. Copy the **Redis URL** (starts with `rediss://`). Example:
   ```text
   rediss://default:xxxxx@us1-xxxxx.upstash.io:6379
   ```
7. **Save it** — you’ll use it as `REDIS_URL` on Render.

### Step 3: Push your code to GitHub

1. Create a new repository on **GitHub** (e.g. `messaging`).
2. On your machine, in the project folder (where `backend` and `frontend` live), run:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git remote add origin https://github.com/YOUR_USERNAME/messaging.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME/messaging` with your repo URL.

### Step 4: Create the Render Web Service

1. Open **[render.com](https://render.com)** and sign up / log in.
2. Click **New +** → **Web Service**.
3. **Connect** your GitHub account if needed, then select the **messaging** repository.
4. Configure the service:
   - **Name:** `messaging-backend` (or any name you like).
   - **Region:** Choose one close to Neon/Upstash (e.g. **Oregon (US West)**).
   - **Branch:** `main`.
   - **Root Directory:** `backend` (important — your app lives in the `backend` folder).
   - **Runtime:** **Docker** (the repo has a `backend/Dockerfile`).
   - **Instance Type:** **Free**.

### Step 5: Set environment variables (critical)

Before clicking **Create Web Service**, scroll to **Environment Variables** and add:

| Key            | Value |
|----------------|--------|
| `DATABASE_URL` | The **Neon** connection string from Step 1 (must be from Neon, not Render Postgres). |
| `REDIS_URL`    | The **Upstash** Redis URL from Step 2 (`rediss://...`). |
| `CORS_ORIGINS` | Leave empty for now; add your frontend URL later. |

- Click **Add** for each variable.
- **Do not** use a Render PostgreSQL “Internal” URL for `DATABASE_URL` — that causes “could not translate host name”. Use only the Neon URI from Step 1.

### Step 6: Deploy

1. Click **Create Web Service**.
2. Wait for the build and deploy to finish (first time can take a few minutes).
3. When it’s live, copy the **service URL** (e.g. `https://messaging-backend-xxxx.onrender.com`).
4. Test:
   - Open the URL in a browser → you should see: `{"message":"Welcome to the Real-Time Chat API"}`.
   - Open `https://your-service-url.onrender.com/health` → you should see: `{"status":"ok"}`.

If the deploy fails, check the **Logs** tab on Render. The most common fix is correcting `DATABASE_URL` to the **Neon** connection string and redeploying.

---

## Deploy frontend on AWS Amplify (do these in order)

Your backend is already live (e.g. `https://sclable-chat-applicaton.onrender.com`). Follow these steps to host the Next.js frontend on AWS Amplify, then connect it to the backend with CORS.

### Step 1: Open AWS Amplify

1. Go to **[AWS Amplify Console](https://console.aws.amazon.com/amplify/)**.
2. Sign in with your AWS account (create one at [aws.amazon.com](https://aws.amazon.com) if needed).
3. Click **New app** → **Host web app**.

### Step 2: Connect GitHub

1. Select **GitHub** as the repository service.
2. Click **Connect to GitHub** and authorize AWS Amplify to access your repositories.
3. Choose the repository that contains this project (e.g. `messaging`).
4. Branch: **main** (or the branch you use for deployment).
5. Click **Next**.

### Step 3: Set build settings (monorepo)

The app code is in the **`frontend`** folder, not the repo root.

1. Expand **Build settings** (or **App build settings**).
2. Click **Edit**.
3. Set **Root directory** to: `frontend`.
4. Leave **Build command** and **Output directory** as Amplify suggests (usually `npm run build` and `out` or `.next` for Next.js).
5. Click **Next**.

### Step 4: Add environment variable

1. Expand **Advanced settings**.
2. Under **Environment variables**, add:

   | Key | Value |
   |-----|--------|
   | `NEXT_PUBLIC_API_URL` | `https://sclable-chat-applicaton.onrender.com` |

   - Use your **exact** Render backend URL.
   - **No trailing slash** (e.g. not `https://...onrender.com/`).

3. Click **Next**.

### Step 5: Deploy

1. Review the settings, then click **Save and deploy**.
2. Wait for the build and deploy to finish (first time may take several minutes).
3. When done, copy your **app URL** (e.g. `https://main.d123abc45678.amplifyapp.com`).

### Step 6: Allow frontend in backend CORS

So the browser can call your API from the Amplify URL:

1. Open **Render** → your backend service → **Environment**.
2. Add or edit **`CORS_ORIGINS`** and set it to your Amplify app URL, e.g.:
   ```text
   https://main.d123abc45678.amplifyapp.com
   ```
   (Use the URL from Step 5; no trailing slash.)
3. Save. Render will redeploy the backend.
4. After redeploy, open your Amplify URL in the browser and try **Register** → **Login** → **Chat**.

---

## Overview

| Component   | Service    | Cost   |
|------------|------------|--------|
| Frontend   | AWS Amplify| Free tier |
| Backend    | Render     | Free tier |
| PostgreSQL | Neon       | Free tier |
| Redis      | Upstash    | Free tier |

---

# Part 1: PostgreSQL (Neon)

## Step 1.1: Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up.
2. **Create a project**:
   - Name: `messaging`
   - Region: Choose closest to you (e.g. `us-east-2`)
3. After creation, copy the **connection string** from the dashboard.
   - Format: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. **Save this** — you’ll use it as `DATABASE_URL` in Render.

---

# Part 2: Redis (Upstash)

## Step 2.1: Create Upstash Redis

1. Go to [upstash.com](https://upstash.com) and sign up.
2. **Create a database**:
   - Name: `messaging-redis`
   - Type: Regional (or Global)
   - Region: Same as Neon (e.g. `us-east-2`) for lower latency
3. After creation, open the database.
4. Copy the **Redis URL** (looks like):
   ```
   rediss://default:YOUR_PASSWORD@us1-xxx.upstash.io:6379
   ```
   - Must use `rediss://` (double s) for TLS.
5. **Save this** — you’ll use it as `REDIS_URL` in Render.

---

# Part 3: Backend (Render)

## Step 3.1: Push Code to GitHub

1. Create a GitHub repo for your project.
2. Push your code:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git remote add origin https://github.com/YOUR_USERNAME/messaging.git
   git push -u origin main
   ```

## Step 3.2: Create Render Web Service

1. Go to [render.com](https://render.com) and sign up.
2. **New** → **Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Name**: `messaging-backend`
   - **Region**: Same as Neon/Upstash (e.g. `Oregon (US West)`).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker** (uses your existing Dockerfile).
   - **Instance Type**: Free.

## Step 3.3: Environment Variables on Render

Add these in **Environment** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `REDIS_URL` | Your Upstash Redis URL (`rediss://...`) |
| `CORS_ORIGINS` | `https://main.xxxxx.amplifyapp.com` *(add this after you deploy Amplify — see Part 4)* |

You can leave `CORS_ORIGINS` empty initially and add it later.

## Step 3.4: Deploy

1. Click **Create Web Service**.
2. Wait for the build and deploy to finish.
3. Copy your **service URL** (e.g. `https://messaging-backend-xxxx.onrender.com`).
4. Open it in a browser — you should see: `{"message":"Welcome to the Real-Time Chat API"}`.

## Step 3.5: Update CORS After Amplify Is Live

1. After deploying the frontend (Part 4), copy your Amplify app URL.
2. In Render: **Environment** → **Environment Variables**.
3. Set `CORS_ORIGINS` to your Amplify URL, e.g.:
   ```
   https://main.d123abc45678.amplifyapp.com
   ```
4. Add multiple origins with commas:
   ```
   https://main.xxx.amplifyapp.com,https://custom-domain.com
   ```
5. Render will redeploy automatically.

---

# Part 4: Frontend (AWS Amplify)

## Step 4.1: Connect GitHub to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/).
2. **New app** → **Host web app**.
3. **GitHub** → Authorize AWS Amplify to access your repo.

## Step 4.2: Select Repository and Branch

1. Choose your `messaging` repository.
2. Branch: `main`.
3. Click **Next**.

## Step 4.3: Build Settings (Monorepo)

Because the frontend is in a `frontend` subfolder:

1. Expand **Build settings** → **Edit**.
2. Set **Root directory** to `frontend`.
3. Amplify will auto-detect Next.js and use `npm run build`.
4. No other changes needed — keep defaults for build command and output.

## Step 4.4: Environment Variables

In **Advanced settings** → **Environment variables**, add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL, e.g. `https://messaging-backend-xxxx.onrender.com` |

Important: no trailing slash.

## Step 4.5: Deploy

1. Click **Next** → **Save and deploy**.
2. Wait for build and deploy.
3. Your app URL will be like: `https://main.d123abc45678.amplifyapp.com`.

## Step 4.6: Update Backend CORS

1. Copy your Amplify app URL.
2. In Render, set `CORS_ORIGINS` to that URL (as in Step 3.5).
3. Render will redeploy; after that, the frontend will be able to call the API.

---

# Part 5: Verify Everything Works

1. **Frontend**: Open your Amplify URL in the browser.
2. **Register** a new user.
3. **Log in** and try chatting (if you have a second user or incognito window).
4. **WebSockets**: Real-time messages use `wss://your-backend.onrender.com/ws/user/{user_id}` — no extra setup needed on the frontend.

---

# Checklist

- [ ] Neon: PostgreSQL created, connection string saved
- [ ] Upstash: Redis created, Redis URL saved
- [ ] Render: Backend deployed with `DATABASE_URL` and `REDIS_URL`
- [ ] Amplify: Frontend deployed with `NEXT_PUBLIC_API_URL`
- [ ] Render: `CORS_ORIGINS` set to Amplify URL
- [ ] Test: Registration, login, and chat work end-to-end

---

# Login / Signup / Fetch Chats Not Working

If the frontend is deployed but you **cannot sign up, log in, or load chats**, work through these in order.

## 1. Frontend is calling the wrong API URL (most common)

The app uses `NEXT_PUBLIC_API_URL` for all API calls. In Next.js, **this value is baked in at build time**. If it was missing or wrong when Amplify built the app, the browser may be calling `http://localhost:8000` instead of your Render URL.

**What to check (browser):**

1. Open your **Amplify app URL** in Chrome (or any browser).
2. Press **F12** → open the **Network** tab.
3. Try **Sign up** or **Log in**.
4. Look for requests to **`localhost:8000`** or to a wrong host. If you see `http://localhost:8000/auth/register` or `/auth/login`, the frontend was built without the correct API URL.

**Fix:**

1. In **AWS Amplify** → your app → **Environment variables** (left menu).
2. Add or edit **`NEXT_PUBLIC_API_URL`** and set it to your backend URL with **no trailing slash**, e.g.  
   `https://sclable-chat-applicaton.onrender.com`
3. **Redeploy** so a new build runs: **Hosting** → **Deployments** → **Redeploy this version**, or push a small commit and let Amplify auto-deploy.  
   Without a new build, the old (wrong) URL stays in the app.

---

## 2. CORS blocking requests

If the backend does not allow your Amplify origin, the browser will block the request and you’ll see **CORS errors** in the **Console** tab (F12).

**What to check (browser):**

- **Console** tab: look for messages like  
  `Access to fetch at 'https://...onrender.com/...' from origin 'https://...amplifyapp.com' has been blocked by CORS policy`.

**Fix:**

1. In **Render** → your backend service → **Environment**.
2. Set **`CORS_ORIGINS`** to your **exact** Amplify app URL, e.g.  
   `https://main.d123abc45678.amplifyapp.com`  
   - Same protocol (`https`), no trailing slash.
   - If you have multiple frontends, separate with commas (no spaces).
3. Save; Render will redeploy. Wait for the deploy to finish, then try again.

---

## 3. Backend returning errors (5xx or 4xx)

Login/signup might fail because the **backend** returns 400, 401, 500, etc.

**What to check (browser):**

- **Network** tab: click the request to `/auth/register` or `/auth/login` and check **Status** (e.g. 500) and **Response** body (often JSON with `detail`).

**What to check (Render):**

1. **Render** → your backend service → **Logs**.
2. Reproduce the issue (try signup/login again) and look for **Python tracebacks** or messages like `OperationalError`, `Connection refused`, `Redis`, etc.

**Typical causes:**

- **Database (Neon):** Wrong or missing `DATABASE_URL`, or DB not reachable. Fix `DATABASE_URL` and redeploy.
- **Redis (Upstash):** Wrong or missing `REDIS_URL`. Chat and real-time features may fail. Fix `REDIS_URL` and redeploy.
- **Cold start:** First request after idle can take ~30 seconds; the request might time out. Try again once; if it works the second time, it’s cold start.

---

## 4. Quick checklist

| Check | Where | What to do |
|------|--------|------------|
| API URL in built app | Browser → Network tab when clicking Login/Signup | If request goes to `localhost:8000`, set `NEXT_PUBLIC_API_URL` in Amplify and **redeploy** (new build). |
| CORS | Browser → Console tab | If CORS errors, set `CORS_ORIGINS` on Render to exact Amplify URL, save, wait for redeploy. |
| Backend 5xx / DB or Redis errors | Render → Logs | Fix `DATABASE_URL` or `REDIS_URL`, redeploy. |
| First request very slow | Render free tier | Wait ~30 s and retry; consider hitting `/health` first to wake the service. |

---

# Troubleshooting

### `could not translate host name "dpg-xxxx-a" to address` (Render)
This means the app is using **Render’s Internal Database URL** for PostgreSQL. That hostname only resolves inside Render’s private network and can fail for web services.

- **Option A (recommended): Use Neon.** Follow Part 1 of this guide. In Render → Environment, set `DATABASE_URL` to your **Neon** connection string (host like `ep-xxx.neon.tech`), e.g.  
  `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
- **Option B: Use Render PostgreSQL.** In the Render dashboard, open your PostgreSQL instance → **Info** → copy the **External Database URL** (not the Internal one). Set that as `DATABASE_URL` in your web service’s Environment variables.

After changing `DATABASE_URL`, save and let Render redeploy.

### Backend fails to start on Render
- Confirm `DATABASE_URL` and `REDIS_URL` are set correctly.
- Check Render logs for connection errors.
- Ensure Neon DB allows external connections (it does by default).
- If you use Neon, `DATABASE_URL` must include `?sslmode=require` (the app adds it if the host is `neon.tech` and it’s missing).

### CORS errors in browser
- Add your Amplify URL to `CORS_ORIGINS` on Render.
- No trailing slash in the URL.
- Redeploy the backend after changing env vars.

### WebSocket connection fails
- Verify `NEXT_PUBLIC_API_URL` uses `https://` (frontend will use `wss://` for WebSockets).
- Render supports WebSockets on the free tier.
- On first use after ~15 minutes idle, Render may need ~30 seconds to wake up.

### Render cold starts
- Free tier services sleep after ~15 minutes of inactivity.
- First request can take ~30 seconds; later requests are fast.
- Upgrade to paid tier if you need no cold starts.

### "No open ports detected" on Render
- The backend must bind to a port (the Dockerfile uses port 8000). If the app crashes **before** binding (e.g. DB connection at import time), Render will report no open ports.
- The app now defers DB setup to startup and exposes a **`/health`** endpoint that does not use the DB. Render can hit `GET /health` for health checks; set the path to `/health` in the Render service if needed.

---

# Environment Variables Summary

| Service  | Variable | Example |
|----------|----------|---------|
| Render   | `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| Render   | `REDIS_URL` | `rediss://default:xxx@us1-xxx.upstash.io:6379` |
| Render   | `CORS_ORIGINS` | `https://main.xxx.amplifyapp.com` |
| Amplify  | `NEXT_PUBLIC_API_URL` | `https://messaging-backend-xxx.onrender.com` |
