# UseGlass Production Deployment

Temporary production mode: **Vercel-only**.

- **Frontend SPA:** Vercel (`npm run build` → `dist/`)
- **Backend API:** Vercel Serverless Function (`api/index.js` → `server/index.js`)
- **Database:** Turso cloud (`libsql://useglasss-radzzz.aws-ap-south-1.turso.io`)

This is used because Railway trial ended and Render requires billing. Move backend to Railway/Render later for smoother streaming, MCP, long-running requests, and durable upload handling.

---

## 1. Deploy to Vercel

### 1.1 Import project

1. Open Vercel dashboard.
2. Add New → Project.
3. Import GitHub repo: `radzfoundation-gif/NEVRA_BETA`.
4. Framework: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Deploy.

`vercel.json` routes:

- `/api/*` → `api/index.js`
- everything else → `index.html`

### 1.2 Set environment variables

Set these in Vercel Project Settings → Environment Variables.

Required:

```env
NODE_ENV=production
VERCEL=1

TURSO_DATABASE_URL=libsql://useglasss-radzzz.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=your_turso_database_token

CLERK_SECRET_KEY=your_clerk_secret_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

SUMOPOD_API_KEY=your_sumopod_api_key
SUMOPOD_BASE_URL=https://ai.sumopod.com
SUMOPOD_MODEL_ID=gpt-5-mini
SUMOPOD_REDESIGN_MODEL_ID=gemini/gemini-3-pro-preview

OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_SITE_NAME=UseGlass AI
OPENROUTER_SITE_URL=https://your-app.vercel.app

VITE_API_BASE_URL=/api
VITE_APP_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Optional:

```env
MIDTRANS_SERVER_KEY=your_midtrans_server_key
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=true

VITE_SUMOPOD_API_KEY=optional_browser_sumopod_key
VITE_OPENROUTER_API_KEY=optional_browser_openrouter_key
VITE_GEMINI_API_KEY=optional_browser_gemini_key
VITE_GROQ_API_KEY=optional_browser_groq_key

VITE_YJS_SERVER_URL=wss://your-yjs-server.example.com
```

Do not set local-only 9Router base URL in Vercel:

```env
NINEROUTER_BASE_URL=http://localhost:20128/v1
```

If you have a cloud-accessible 9Router/OpenAI-compatible URL, set it; otherwise leave 9Router unset and use OpenRouter/SumoPod.

### 1.3 Redeploy after env

After adding env vars:

1. Go to Deployments.
2. Open latest deployment menu.
3. Click Redeploy.

---

## 2. Verify deployment

### API health

Open:

```txt
https://your-app.vercel.app/api/turso/health
```

Expected:

```json
{"ok":true,"provider":"turso"}
```

### App smoke test

Browser checks:

- Home loads.
- Login works.
- Chat prompt streams/responds.
- Save to Project works.
- Canvas opens.
- Browser console has no CORS errors.

DB check from local machine:

```bash
node scripts/db.mjs --counts
```

After creating data in UI, counts for `chat_sessions`, `chat_messages`, `projects`, or `saved_outputs` should increase.

---

## 3. Clerk setup

In Clerk dashboard, add Vercel domain to allowed origins/redirect URLs:

```txt
https://your-app.vercel.app
```

Add custom domain later if used.

---

## 4. Known caveats in Vercel-only mode

- API cold starts can add latency.
- Serverless function timeout is 60 seconds (`vercel.json`).
- MCP and long-lived connections are not suitable on Vercel serverless.
- Uploads use ephemeral filesystem and are not durable.
- Large AI generations or team workflows may timeout.

Recommended long-term architecture: Vercel frontend + Railway/Render/Fly backend + Turso DB.
