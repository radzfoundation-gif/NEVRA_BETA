# 🔧 Fix: Moonshot "Invalid Authentication" Error

## Error
```
Moonshot API Error: Invalid Authentication
```

## Penyebab
1. API key tidak valid atau expired
2. API key format salah
3. API key belum diaktifkan di dashboard Moonshot

## Solusi

### 1. Verifikasi API Key di Dashboard Moonshot

1. Login ke https://platform.moonshot.ai/console/api-keys (Kimi K2)
2. Buka **API Keys** section
3. Cek apakah API key masih aktif
4. Jika tidak ada atau expired, buat API key baru

### 2. Dapatkan API Key Baru

1. Di dashboard Moonshot, klik **Create API Key**
2. Copy API key yang baru (format: `sk-...`)
3. Pastikan API key sudah diaktifkan

### 3. Update .env File

Ganti API key di file `.env`:

```bash
MOONSHOT_API_KEY=sk-your-new-api-key-here
```

**Pastikan:**
- Tidak ada spasi di awal/akhir
- Tidak ada tanda kutip
- Format benar: `sk-...`

### 4. Restart Server

Setelah update API key, **WAJIB restart server**:

```bash
# Stop server (Ctrl+C)
# Start lagi
npm run api
# atau
node server/index.js
```

### 5. Test API Key (Optional)

Test API key dengan curl:

```bash
curl https://api.moonshot.ai/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Jika berhasil, akan return list models. Jika error, berarti API key tidak valid.

## Troubleshooting

### Masih Error Setelah Update?

1. **Cek format API key:**
   - Harus dimulai dengan `sk-`
   - Panjang minimal 20 karakter
   - Tidak ada karakter aneh

2. **Cek apakah API key aktif:**
   - Login ke dashboard Moonshot
   - Pastikan API key status = Active
   - Cek apakah ada limit/quota

3. **Cek base URL:**
   - Moonshot (Kimi K2) menggunakan: `https://api.moonshot.ai/v1`
   - Platform: https://platform.moonshot.ai
   - Pastikan tidak ada typo

4. **Cek console server:**
   - Lihat apakah ada error saat initialize client
   - Pastikan `moonshotClient` tidak null

### API Key Expired?

Jika API key expired:
1. Buat API key baru di dashboard
2. Update di `.env`
3. Restart server

### Rate Limit?

Jika mendapat rate limit error:
- Tunggu beberapa saat
- Cek quota di dashboard
- Pertimbangkan upgrade plan

## Verifikasi Setup

Setelah fix, test dengan:
1. Pilih Moonshot dari provider selector
2. Kirim pesan test
3. Seharusnya tidak ada error authentication
