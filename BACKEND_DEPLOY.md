# 🚀 Deploy Backend API Saja

Panduan deploy hanya backend API ke platform cloud.

## Platform yang Disarankan:

### 1. Railway.app (Paling Mudah) ⭐

**Langkah:**
1. Sign up di https://railway.app (pakai GitHub)
2. Klik "New Project" → "Deploy from GitHub repo"
3. Pilih repository NEVRA Anda
4. Railway akan auto-detect Node.js

**Set Environment Variables:**
Di Railway dashboard → Variables, tambahkan:
```
PORT=8788
CORS_ORIGIN=https://rlabs-studio.cloud
GROQ_API_KEY=your_groq_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_SITE_URL=https://rlabs-studio.cloud
OPENROUTER_SITE_NAME=Nevra
```

**Set Start Command:**
- Settings → Deploy
- Start Command: `node server/index.js`
- Root Directory: (biarkan kosong)

**Deploy:**
- Railway akan otomatis deploy
- Tunggu 2-3 menit
- Dapatkan URL: `https://your-app.railway.app`

**Test:**
- Buka: `https://your-app.railway.app/api/health`
- Harus return: `{ ok: true }`

---

### 2. Render.com (Alternatif)

**Langkah:**
1. Sign up di https://render.com (pakai GitHub)
2. New → Web Service
3. Connect GitHub repository NEVRA
4. Set:
   - **Name**: `nevra-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: Free (untuk testing)

**Environment Variables:**
Tambahkan semua env vars seperti di Railway

**Deploy:**
- Render akan auto-deploy
- URL: `https://nevra-api.onrender.com`

---

### 3. Fly.io (Alternatif)

**Via CLI:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Deploy
fly launch
# Pilih: Node.js app
# Set start command: node server/index.js

# Set secrets
fly secrets set GROQ_API_KEY=your_key
fly secrets set OPENROUTER_API_KEY=your_key
fly secrets set CORS_ORIGIN=https://rlabs-studio.cloud
# ... dst

# Deploy
fly deploy
```

---

## Setelah Deploy:

### 1. Dapatkan URL API
Contoh: `https://your-app.railway.app`

### 2. Test Endpoint
```bash
# Health check
curl https://your-app.railway.app/api/health

# Root
curl https://your-app.railway.app/
```

### 3. Update Frontend
Di frontend, set environment variable:
```env
VITE_API_BASE_URL=https://your-app.railway.app/api
```

Lalu rebuild frontend:
```bash
npm run build
```

Upload hasil build ke cPanel untuk frontend.

---

## Troubleshooting:

### API tidak bisa diakses
- Cek logs di platform dashboard
- Pastikan PORT sudah di-set
- Pastikan CORS_ORIGIN sudah benar

### Error 500
- Cek logs untuk detail error
- Pastikan semua dependencies terinstall
- Pastikan env vars sudah di-set semua

### CORS Error
- Pastikan `CORS_ORIGIN` di-set ke domain frontend Anda
- Contoh: `https://rlabs-studio.cloud`

---

## File yang Dibutuhkan:

✅ `server/index.js` - File utama backend
✅ `package.json` - Dependencies
✅ `railway.json` - Konfigurasi Railway (opsional)
✅ `Procfile` - Untuk Render/Heroku (opsional)

**TIDAK PERLU:**
❌ Frontend files (components, dist, dll)
❌ Vite config
❌ React dependencies (kecuali jika backend butuh)

---

## Rekomendasi:

**Gunakan Railway** karena:
- ✅ Paling mudah setup
- ✅ Auto-detect Node.js
- ✅ Gratis untuk testing
- ✅ Support ES modules
- ✅ Auto HTTPS
- ✅ Logs mudah diakses
