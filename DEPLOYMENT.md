# NOIR AI Production SaaS - Deployment Guide

## 🚀 Deployment Overview

NOIR AI requires three separate deployments:

1. **Frontend + API Routes** → Vercel
2. **YJS Collaboration Server** → Railway/Render
3. **Database** → Supabase

---

## 1. Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database provisioning

### Step 2: Run Database Migration

```bash
# Option A: Using Supabase CLI (recommended)
supabase db push

# Option B: Manual SQL execution
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Copy content from supabase/migrations/001_initial_schema.sql
# 3. Execute the SQL
```

### Step 3: Get Environment Variables

From Supabase Dashboard > Project Settings > API:

- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon/public key
- `SUPABASE_SERVICE_KEY`: Service role key (keep secret!)
- `SUPABASE_JWT_SECRET`: JWT Secret (for YJS server)

### Step 4: Configure RLS (Already included in migration)

✅ RLS policies are automatically created by the migration script.

---

## 2. Vercel Deployment (Frontend + API)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure build settings (auto-detected for Next.js)

### Step 3: Set Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Sumopod AI
SUMOPOD_KEY=sk-your-sumopod-api-key

# YJS Server (will be set after deploying YJS server)
NEXT_PUBLIC_YJS_SERVER_URL=wss://your-yjs-server.railway.app

# App
NEXT_PUBLIC_APP_URL=https://noir-ai.com
NODE_ENV=production
```

### Step 4: Deploy

Click "Deploy" - Vercel will automatically build and deploy.

---

## 3. YJS Server Deployment (Railway)

### Option A: Railway (Recommended)

#### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

#### Step 2: Deploy YJS Server

```bash
# From your project root
cd yjs-server

# Initialize Railway project
railway init

# Set environment variables
railway variables set SUPABASE_JWT_SECRET=your-jwt-secret
railway variables set PORT=1234
railway variables set NODE_ENV=production

# Deploy
railway up
```

#### Step 3: Get WebSocket URL

After deployment:
1. Go to Railway Dashboard
2. Click on your service
3. Go to "Settings" > "Domains"
4. Generate domain (e.g., `your-app.railway.app`)
5. Your WebSocket URL: `wss://your-app.railway.app`

#### Step 4: Update Vercel Environment

Go back to Vercel > Environment Variables:
```env
NEXT_PUBLIC_YJS_SERVER_URL=wss://your-app.railway.app
```

Redeploy Vercel for changes to take effect.

---

### Option B: Render

#### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### Step 2: Deploy YJS Server

1. New > Web Service
2. Connect your repository
3. Configure:
   - **Root Directory**: `yjs-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

#### Step 3: Set Environment Variables

```env
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=1234
NODE_ENV=production
```

#### Step 4: Get WebSocket URL

After deployment, copy the service URL (e.g., `https://noir-ai-yjs.onrender.com`)

Use WebSocket protocol: `wss://noir-ai-yjs.onrender.com`

---

## 4. Environment Variables Reference

### Frontend (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sumopod AI
SUMOPOD_KEY=sk-1BmaayhWccwE0E715vfSjw

# YJS Collaboration Server
NEXT_PUBLIC_YJS_SERVER_URL=wss://noir-ai-yjs.railway.app

# App Configuration
NEXT_PUBLIC_APP_URL=https://noir-ai.com
NODE_ENV=production
```

### YJS Server (.env)

```env
# Supabase JWT Secret (for token verification)
SUPABASE_JWT_SECRET=your-super-secret-jwt-secret

# Server Configuration
PORT=1234
NODE_ENV=production
```

---

## 5. Post-Deployment Verification

### Check Frontend

```bash
# Test main page
curl https://noir-ai.com

# Test API endpoint
curl -X POST https://noir-ai.com/api/analyze-canvas \
  -H "Content-Type: application/json" \
  -d '{"canvasJSON":{"elements":[]}}' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check YJS Server

```bash
# Health check
curl https://your-yjs-server.railway.app/health

# Expected response:
# {
#   "status": "ok",
#   "uptime": 12345,
#   "activeRooms": 0,
#   "totalConnections": 0
# }
```

### Check Supabase

1. Supabase Dashboard > Table Editor
2. Verify tables exist:
   - user_profiles
   - canvas_sessions
   - ai_usage
   - subscriptions
   - waitlist
   - rate_limits

---

## 6. Troubleshooting

### Issue: "EROFS: read-only file system"

✅ **Fixed** - All filesystem writes removed, using Supabase only.

### Issue: "YJS connection failed"

- Check `NEXT_PUBLIC_YJS_SERVER_URL` in Vercel
- Verify YJS server is running (health check)
- Check CORS settings
- Verify JWT secret matches between Supabase and YJS server

### Issue: "Rate limit exceeded"

- Check Supabase `rate_limits` table
- Manually reset: Delete rows for user
- Increase limits in `lib/rateLimiter.ts`

### Issue: "Insufficient tokens"

- Check user plan in `user_profiles` table
- Manually add tokens:
  ```sql
  UPDATE user_profiles 
  SET tokens_remaining = 100 
  WHERE id = 'user-uuid';
  ```

---

## 7. Monitoring

### Vercel

- Analytics: Vercel Dashboard > Analytics
- Logs: Vercel Dashboard > Deployments > Logs

### Railway/Render

- Metrics: Service Dashboard > Metrics
- Logs: Service Dashboard > Logs

### Supabase

- Database Stats: Supabase Dashboard > Database
- API Logs: Supabase Dashboard > Logs

---

## 8. Scaling Considerations

### Database

- Enable connection pooling in Supabase
- Add indexes for frequently queried columns
- Archive old `ai_usage` records (>90 days)

### YJS Server

- Use Redis for document storage (instead of in-memory)
- Deploy multiple YJS instances with load balancer
- Implement sticky sessions for WebSocket connections

### API Routes

- Enable Vercel Edge Functions for faster response
- Implement caching for read-heavy endpoints
- Use Vercel Analytics to identify bottlenecks

---

## 9. Security Checklist

- [x] RLS enabled on all Supabase tables
- [x] Service key only used in server-side code
- [x] JWT verification on YJS WebSocket connections
- [x] Rate limiting on all API endpoints
- [x] Input validation on all user inputs
- [x] CORS configured properly
- [ ] SSL certificates configured
- [ ] DDoS protection enabled (Vercel Pro)
- [ ] Security headers configured

---

## 10. Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Supabase migration applied successfully
- [ ] YJS server deployed and accessible
- [ ] Test canvas collaboration with 2+ users
- [ ] Test AI analysis with real prompts
- [ ] Verify rate limiting works
- [ ] Verify token billing deducts correctly
- [ ] Test Pro plan upgrade flow
- [ ] Monitor logs for errors (24h)
- [ ] Load testing completed
- [ ] Backup strategy configured
- [ ] Error monitoring setup (Sentry recommended)

---

## Support

For issues during deployment, check:
- Vercel logs
- Railway/Render logs
- Supabase logs
- Browser console (frontend errors)

Good luck with your deployment! 🚀
