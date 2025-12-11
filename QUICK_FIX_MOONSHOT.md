# 🔧 Quick Fix: Moonshot API Key Error

## Error yang Terjadi
```
MOONSHOT Error: moonshot API key not configured
```

## Solusi

### 1. Tambahkan API Key ke Environment Variables

**Jika Development (Local):**

Tambahkan ke file `.env` di root project:

```bash
MOONSHOT_API_KEY=sk-rbkagNDoFmFCQILq5XOAbuLtBIFUC3Rk5frevqvx82wUCtag
MOONSHOT_MAX_TOKENS=8192
```

**Jika Production (Server/Hosting):**

Tambahkan environment variable di hosting platform Anda:

- **Railway**: Settings → Variables → Add `MOONSHOT_API_KEY`
- **Render**: Environment → Add `MOONSHOT_API_KEY`
- **Vercel**: Settings → Environment Variables → Add `MOONSHOT_API_KEY`
- **cPanel/Server**: Tambahkan ke `.env` atau environment variables

### 2. Restart Server

**Development:**
```bash
# Stop server (Ctrl+C)
# Start lagi
npm run api
# atau
node server/index.js
```

**Production:**
- Restart aplikasi di hosting platform
- Atau redeploy jika perlu

### 3. Verifikasi

Setelah restart, coba lagi menggunakan Moonshot provider. Error seharusnya hilang.

## Troubleshooting

### Masih Error Setelah Restart?

1. **Cek apakah API key benar:**
   - Pastikan format: `sk-...`
   - Tidak ada spasi di awal/akhir
   - Tidak ada tanda kutip

2. **Cek apakah server membaca env var:**
   ```bash
   # Di terminal server, cek:
   echo $MOONSHOT_API_KEY
   ```

3. **Pastikan dotenv sudah di-load:**
   - File `server/index.js` sudah ada `import 'dotenv/config';` di baris pertama

4. **Cek console server:**
   - Lihat apakah ada error saat startup
   - Pastikan `moonshotClient` tidak null

### Jika Menggunakan Multiple .env Files

Pastikan menambahkan ke file yang benar:
- `.env` - untuk development
- `.env.local` - untuk local overrides
- `.env.production` - untuk production

Server akan membaca dari file yang sesuai dengan environment.
