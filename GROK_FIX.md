# 🔧 Fix: Grok "API key not configured" Error

## Error
```
GROK Error: grok API key not configured
```

## Penyebab
Grok menggunakan `GROQ_API_KEY` yang sama dengan provider Groq. Error ini muncul jika:
1. `GROQ_API_KEY` belum di-set di `.env`
2. Server belum di-restart setelah menambahkan API key

## Solusi

### 1. Pastikan GROQ_API_KEY Ada di .env

Cek file `.env` di root project, pastikan ada:
```bash
GROQ_API_KEY=gsk_your_groq_api_key_here
```

**Catatan:** Grok menggunakan API key yang sama dengan Groq (Llama 3), jadi tidak perlu API key terpisah.

### 2. Restart Server

**WAJIB restart server** setelah menambahkan atau mengubah API key:

```bash
# Stop server (Ctrl+C)
# Start lagi
npm run api
# atau
node server/index.js
```

### 3. Verifikasi

Setelah restart, coba lagi menggunakan provider "Kimi K2 (Grok)". Error seharusnya hilang.

## Technical Details

- **Provider**: `grok`
- **API Key**: Menggunakan `GROQ_API_KEY` (sama dengan provider Groq)
- **Model**: `moonshotai/kimi-k2-instruct-0905`
- **SDK**: Groq SDK

## Troubleshooting

### Masih Error Setelah Restart?

1. **Cek apakah GROQ_API_KEY valid:**
   ```bash
   # Di terminal, test:
   echo $GROQ_API_KEY
   ```

2. **Cek format API key:**
   - Groq API key format: `gsk_...`
   - Pastikan tidak ada spasi di awal/akhir
   - Pastikan tidak ada tanda kutip

3. **Cek console server:**
   - Lihat apakah ada error saat startup
   - Pastikan `groqClient` tidak null (karena grok menggunakan groqClient yang sama)

4. **Test Groq API key:**
   - Coba gunakan provider "Llama 3 (Groq)" dulu
   - Jika Groq bekerja, berarti API key valid
   - Grok akan otomatis bekerja karena menggunakan API key yang sama

## Catatan

Grok (Kimi K2) dan Groq (Llama 3) menggunakan:
- ✅ API key yang sama (`GROQ_API_KEY`)
- ✅ SDK yang sama (Groq SDK)
- ✅ Client yang sama (`groqClient`)

Perbedaannya hanya di **model** yang digunakan:
- Groq: `llama-3.3-70b-versatile`
- Grok: `moonshotai/kimi-k2-instruct-0905`
