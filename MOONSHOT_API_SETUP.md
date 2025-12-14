# 🌙 Moonshot API Setup

## Overview

Moonshot AI (Kimi) telah terintegrasi ke NEVRA sebagai provider AI tambahan.

## Setup

### 1. Dapatkan API Key

1. Kunjungi: https://platform.moonshot.ai/console/api-keys (Kimi K2)
2. Buat akun atau login
3. Dapatkan API key dari dashboard

### 2. Set Environment Variable

Tambahkan ke `.env` atau environment variables di server:

```bash
MOONSHOT_API_KEY=sk_your_moonshot_api_key_here
MOONSHOT_MAX_TOKENS=8192  # Optional, default: 8192
```

### 3. Restart Server

Setelah menambahkan environment variable, restart server:

```bash
# Development
npm run dev

# Production
node server/index.js
```

## Features

- ✅ Text generation
- ✅ Code generation  
- ✅ Image understanding (via vision API)
- ✅ Support untuk Builder dan Tutor mode

## Model

Default model: `moonshot-v1-8k`

Available models:
- `moonshot-v1-8k` - 8K context
- `moonshot-v1-32k` - 32K context
- `moonshot-v1-128k` - 128K context

Untuk mengubah model, edit `MODELS.moonshot` di `server/index.js`.

## Usage

1. Pilih **Moonshot** dari provider selector di UI
2. Gunakan seperti provider lainnya (Groq, OpenAI, dll)
3. Sistem akan otomatis menggunakan Moonshot API

## API Endpoint

Moonshot (Kimi K2) menggunakan OpenAI-compatible API:
- Base URL: `https://api.moonshot.ai/v1`
- Platform: https://platform.moonshot.ai (Kimi K2)
- Menggunakan OpenAI SDK dengan baseURL override

## Token Limits

- Builder mode: 8192 tokens (default)
- Tutor mode: 4096 tokens (50% dari builder)

Bisa diubah via `MOONSHOT_MAX_TOKENS` environment variable.

## Troubleshooting

### Error: "Moonshot client not initialized"
- Pastikan `MOONSHOT_API_KEY` sudah di-set
- Restart server setelah menambahkan env var

### Error: "API key not configured"
- Cek apakah API key valid
- Pastikan format: `sk-...`

### Rate Limit Error
- Moonshot memiliki rate limit
- Tunggu beberapa saat dan coba lagi
- Pertimbangkan upgrade plan jika perlu
