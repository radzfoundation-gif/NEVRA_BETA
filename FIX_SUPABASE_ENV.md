# 🔧 Fix: Missing Supabase Credentials Error

## Error yang Terjadi
```
Uncaught Error: Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file
```

## Solusi Cepat

### Jika di Vercel (Production)

1. **Buka Vercel Dashboard:**
   - https://vercel.com
   - Pilih project NEVRA Anda
   - Masuk ke **Settings** → **Environment Variables**

2. **Tambahkan Environment Variables:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Pilih Environment:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional)

4. **Redeploy:**
   - Setelah menambah variables, klik **Redeploy** di Vercel Dashboard
   - Atau push commit baru untuk trigger auto-deploy

### Jika di Local Development

1. **Buat file `.env.local`** di root project (jika belum ada)

2. **Tambahkan:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## Cara Mendapatkan Supabase Credentials

1. **Buka Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Pilih project Anda

2. **Masuk ke Settings → API:**
   - **Project URL** → Copy untuk `VITE_SUPABASE_URL`
   - **anon/public key** → Copy untuk `VITE_SUPABASE_ANON_KEY`

---

## Verifikasi

Setelah menambah variables:

1. **Di Vercel:**
   - Check di **Settings** → **Environment Variables**
   - Pastikan variables muncul dengan ✅
   - Redeploy project

2. **Di Local:**
   - Restart dev server
   - Check console tidak ada error lagi

---

## Troubleshooting

### Masih Error Setelah Redeploy?

1. **Pastikan format benar:**
   - `VITE_SUPABASE_URL` harus dimulai dengan `https://`
   - `VITE_SUPABASE_ANON_KEY` adalah string panjang (JWT token)

2. **Check di Vercel:**
   - Pastikan variables di-set untuk **Production** environment
   - Variables dengan prefix `VITE_` harus di-set di Vercel

3. **Clear cache:**
   - Hard refresh browser (Ctrl+Shift+R)
   - Clear browser cache

4. **Check build logs:**
   - Di Vercel Dashboard → Deployments
   - Klik deployment terbaru → View logs
   - Pastikan tidak ada error saat build

---

## Quick Fix Script

Jika menggunakan Vercel CLI:

```bash
# Login ke Vercel
vercel login

# Add Supabase variables
echo "https://your-project.supabase.co" | vercel env add VITE_SUPABASE_URL production
echo "your_anon_key_here" | vercel env add VITE_SUPABASE_ANON_KEY production

# Redeploy
vercel --prod
```

---

*Last updated: $(date)*

