# Cara Menjalankan Backend

## Prerequisites
- Node.js terinstall (versi 18 atau lebih baru)
- Dependencies sudah diinstall (`npm install`)

## Langkah-langkah

### 1. Setup Environment Variables

Pastikan file `.env` sudah ada dan berisi environment variables yang diperlukan:

```bash
# API Keys
GROQ_API_KEY=your_groq_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional: Custom Port (default: 8788)
PORT=8788

# Optional: CORS Origin (default: allow all)
CORS_ORIGIN=true

# Optional: OpenRouter Configuration
OPENROUTER_SITE_URL=https://rlabs-studio.cloud
OPENROUTER_SITE_NAME=Nevra

# Optional: Max Tokens Configuration
GROQ_MAX_TOKENS_BUILDER=8192
GROQ_MAX_TOKENS_TUTOR=4096
DEEPSEEK_MAX_TOKENS=4096
OPENROUTER_MAX_TOKENS=2000
GROK_MAX_TOKENS_BUILDER=4096
GROK_MAX_TOKENS_TUTOR=4096
```

### 2. Menjalankan Backend

Ada 2 cara untuk menjalankan backend:

#### Cara 1: Menggunakan npm script (Recommended)
```bash
npm run api
```

#### Cara 2: Langsung menggunakan node
```bash
node server/index.js
```

### 3. Verifikasi Backend Berjalan

Setelah menjalankan, Anda akan melihat output:
```
API proxy listening on 8788
```

Backend akan berjalan di: **http://localhost:8788**

### 4. Test Backend

Anda bisa test dengan curl atau browser:
```bash
# Test health check (jika ada)
curl http://localhost:8788/api/health

# Atau buka di browser
# http://localhost:8788
```

## Menjalankan Frontend + Backend Bersamaan

### Terminal 1: Backend
```bash
npm run api
```

### Terminal 2: Frontend (Development)
```bash
npm run dev
```

Frontend akan otomatis proxy request `/api/*` ke backend di `http://localhost:8788`

## Troubleshooting

### Port sudah digunakan
Jika port 8788 sudah digunakan, ubah di `.env`:
```bash
PORT=8789
```

### CORS Error
Pastikan `CORS_ORIGIN` di `.env` sesuai dengan frontend URL, atau set ke `true` untuk allow all.

### API Key tidak ditemukan
Pastikan semua API keys sudah di-set di file `.env`:
- `GROQ_API_KEY` (wajib untuk Groq dan Grok/Kimi K2)
- `DEEPSEEK_API_KEY` (wajib untuk DeepSeek)
- `OPENROUTER_API_KEY` (wajib untuk OpenAI via OpenRouter)

### Module not found
Install dependencies terlebih dahulu:
```bash
npm install
```

## Production Deployment

Untuk production, gunakan process manager seperti:
- **PM2**: `pm2 start server/index.js --name nevra-api`
- **Docker**: Build dan run container
- **Railway/Heroku**: Deploy langsung dari repository

Lihat file `RAILWAY_DEPLOY.md` atau `BACKEND_DEPLOY.md` untuk instruksi deployment lengkap.
