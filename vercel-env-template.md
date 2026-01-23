# 📋 Environment Variables Template untuk Vercel

Copy-paste environment variables ini ke Vercel Dashboard atau gunakan script `upload-env-to-vercel.sh`

## 🔐 Required Environment Variables

### Frontend (VITE_*)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_CLERK_SUPABASE_TEMPLATE=supabase
```

### Backend API Keys
```
OPENROUTER_API_KEY=sk-or-v1-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Supabase Service (untuk backend)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Optional
```
CORS_ORIGIN=https://your-domain.vercel.app
OPENROUTER_SITE_URL=https://your-domain.vercel.app
OPENROUTER_SITE_NAME=NOIR AI
FRONTEND_URL=https://your-domain.vercel.app
```

### Additional API Keys (jika digunakan)
```
DEEPSEEK_API_KEY=sk-...
MOONSHOT_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=https://your-domain.vercel.app/api/github/callback
VERCEL_TOKEN=...
NETLIFY_TOKEN=...
```

---

## 🚀 Cara Upload ke Vercel

### Option 1: Menggunakan Script (Recommended)
```bash
# Pastikan Vercel CLI sudah terinstall
npm i -g vercel

# Login ke Vercel
vercel login

# Jalankan script
./upload-env-to-vercel.sh
```

### Option 2: Manual via Vercel Dashboard
1. Buka https://vercel.com
2. Pilih project Anda
3. Masuk ke **Settings** → **Environment Variables**
4. Tambahkan setiap variable satu per satu
5. Pilih environment (Production, Preview, Development)
6. Klik **Save**

### Option 3: Menggunakan Vercel CLI Manual
```bash
# Login
vercel login

# Add environment variable
vercel env add VITE_CLERK_PUBLISHABLE_KEY production
# (akan prompt untuk input value)

# Atau langsung dengan value
echo "your_value" | vercel env add VITE_CLERK_PUBLISHABLE_KEY production

# Untuk semua environments
for env in production preview development; do
    echo "your_value" | vercel env add VITE_CLERK_PUBLISHABLE_KEY $env
done
```

---

## 📝 Notes

- **VITE_*** variables: Harus di-set di Vercel untuk bisa diakses di frontend
- **Backend variables**: Tidak perlu prefix `VITE_`, langsung digunakan di server
- **Environment**: Set untuk Production, Preview, dan Development sesuai kebutuhan
- **Security**: Jangan commit `.env` file ke git!

---

## ✅ Checklist

- [ ] Vercel CLI terinstall
- [ ] Sudah login ke Vercel (`vercel login`)
- [ ] Semua required variables sudah di-set
- [ ] Variables di-set untuk environment yang benar (Production/Preview/Development)
- [ ] Redeploy setelah menambah variables baru

