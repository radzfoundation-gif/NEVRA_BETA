# UseGlass Production Deployment

UseGlass production uses split deployment:

- **Backend API:** Railway (`node server/index.js`)
- **Frontend SPA:** Vercel (`npm run build` → `dist/`)
- **Database:** Turso cloud (`libsql://useglasss-radzzz.aws-ap-south-1.turso.io`)

This avoids Vercel serverless limits for streaming AI, MCP, upload handling, and long-running backend routes.

---

## 1. Backend deploy: Railway

### 1.1 Create Railway service

1. Open Railway dashboard.
2. Create a new project from the GitHub repository.
3. Keep root directory as repository root.
4. Railway reads `railway.json` and runs:
   - Build: `npm install`
   - Start: `node server/index.js`
   - Healthcheck: `/api/turso/health`

### 1.2 Set Railway environment variables

Minimum required backend variables:

```env
NODE_ENV=production
PORT=8788

TURSO_DATABASE_URL=libsql://useglasss-radzzz.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=your_turso_database_token

CLERK_SECRET_KEY=your_clerk_secret_key

SUMOPOD_API_KEY=your_sumopod_api_key
SUMOPOD_BASE_URL=https://ai.sumopod.com
SUMOPOD_MODEL_ID=gpt-5-mini
SUMOPOD_REDESIGN_MODEL_ID=gemini/gemini-3-pro-preview

NINEROUTER_API_KEY=your_9router_api_key
NINEROUTER_BASE_URL=http://localhost:20128/v1
NINEROUTER_DEFAULT_MODEL=kr/claude-sonnet-4.5

OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_SITE_URL=https://your-app.vercel.app
OPENROUTER_SITE_NAME=UseGlass AI

MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_IS_PRODUCTION=true

ALLOWED_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

For first deploy, if Vercel domain is not known yet, set:

```env
ALLOWED_ORIGINS=
FRONTEND_URL=http://localhost:3000
```

After Vercel deploy, update both to the Vercel domain and redeploy Railway.

### 1.3 Verify Railway backend

After deploy, open:

```bash
curl https://your-railway-app.up.railway.app/api/turso/health
```

Expected:

```json
{"ok":true,"provider":"turso"}
```

If healthcheck fails:

- Check `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
- Check Railway logs for boot errors.
- Confirm server binds port: code uses `app.listen(PORT, '0.0.0.0')` outside Vercel.

---

## 2. Frontend deploy: Vercel

### 2.1 Create Vercel project

1. Import same GitHub repo into Vercel.
2. Framework: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. `vercel.json` keeps SPA fallback only; API runs on Railway, not Vercel.

### 2.2 Set Vercel environment variables

Minimum frontend variables:

```env
VITE_API_BASE_URL=https://your-railway-app.up.railway.app
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_APP_URL=https://your-app.vercel.app

VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key

VITE_SUMOPOD_API_KEY=optional_browser_sumopod_key
VITE_OPENROUTER_API_KEY=optional_browser_openrouter_key
VITE_GEMINI_API_KEY=optional_browser_gemini_key
VITE_GROQ_API_KEY=optional_browser_groq_key

VITE_YJS_SERVER_URL=wss://your-yjs-server.example.com
```

Keep server-only secrets out of Vercel frontend variables unless they start with `VITE_` and are safe for browser exposure.

### 2.3 Verify Vercel frontend

1. Open `https://your-app.vercel.app`.
2. Home should load without API error.
3. Open browser DevTools → Network.
4. Send a chat prompt.
5. API requests should go to `https://your-railway-app.up.railway.app`, not `/api/index.js` on Vercel.

---

## 3. Loop back after both deploys

After Vercel domain is known:

1. Update Railway:

```env
ALLOWED_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
OPENROUTER_SITE_URL=https://your-app.vercel.app
```

2. Redeploy Railway.
3. Update Clerk dashboard:
   - Add Vercel domain to allowed origins / redirect URLs.
   - If using custom domain, add it too.
4. Test login and chat again.

---

## 4. Production smoke test

Run these checks after deploy:

```bash
curl https://your-railway-app.up.railway.app/api/turso/health
node scripts/db.mjs --counts
```

Browser checks:

- Home loads.
- Login works.
- Chat streaming works.
- Save to Project works.
- Canvas opens.
- No CORS errors in console.

DB check:

```bash
node scripts/db.mjs --counts
```

After creating data in UI, counts for `chat_sessions`, `chat_messages`, `projects`, or `saved_outputs` should increase.

---

## 5. Known production caveats

- File uploads currently use local container filesystem (`server/uploads/`). Railway storage is ephemeral across deploys/restarts. For durable uploads, move to R2/S3/Turso blob-like storage later.
- MCP can run on Railway because it is long-lived, but not on Vercel serverless.
- Turso schema initialization is lazy via `/api/turso/*` route readiness. DB already has production schema applied.
- Rotate the leaked historical `NINEROUTER_API_KEY` if still active.
- Add Turso backup automation separately.
