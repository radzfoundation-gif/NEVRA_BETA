# Vercel Deployment Checklist

## ✅ Ready to Deploy!

Your Nevra AI is **configured for Vercel**. Follow this checklist:

### 1. Verify Files
- ✅ `vercel.json` - Already configured
- ✅ `api/index.js` - Serverless wrapper exists
- ✅ `dist/` - Will be generated on build

### 2. Environment Variables (Add in Vercel Dashboard)

**Frontend (VITE_*):**
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Backend (Server/API):**
```
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key (fallback)
ANTHROPIC_API_KEY=your_anthropic_key (optional)
OPENAI_API_KEY=your_openai_key (optional)
DEEPSEEK_API_KEY=your_deepseek_key (optional)
GEMINI_API_KEY=your_gemini_key (optional)
TAVILY_API_KEY=your_tavily_key (for web search)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} (JSON string)
STRIPE_SECRET_KEY=your_stripe_key (optional)
NODE_ENV=production
```

### 3. Disable MCP for Production

MCP server won't work on Vercel serverless. It's already configured to fallback:

```typescript
// lib/workflow/config.ts already has:
enableMCP: process.env.VERCEL ? false : true
```

But currently it's set to `true`. For production safety, consider:
```typescript
enableMCP: false, // Disable for production, use Firebase direct
```

### 4. Deploy Commands

**Option A: GitHub (Recommended)**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```
Then connect repo in Vercel Dashboard.

**Option B: CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 5. Post-Deployment

- [ ] Update Clerk allowed origins with Vercel domain
- [ ] Update Firebase authorized domains  
- [ ] Test login/signup
- [ ] Test AI chat
- [ ] Verify Firebase persistence
- [ ] Monitor Vercel function logs

## 🎯 Expected Results

- **Build Time**: ~2-3 minutes
- **Deploy URL**: `https://your-project.vercel.app`
- **API**: `https://your-project.vercel.app/api/*`
- **Functions**: Serverless, max 60s duration

## Troubleshooting

**Build fails?**
- Check environment variables
- Run `npm run build` locally first

**API 404?**
- Verify `api/index.js` exists
- Check `vercel.json` rewrites

**MCP errors?**
- Expected! MCP doesn't work on Vercel
- Fallback to Firebase should be automatic

Lihat detail lengkap di `vercel_deployment.md` artifact! 📚
