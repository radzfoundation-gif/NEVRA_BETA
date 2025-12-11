# 🚀 Grok (Kimi K2) Setup

## Overview

Grok provider menggunakan Groq SDK untuk mengakses model Kimi K2 (`moonshotai/kimi-k2-instruct-0905`) melalui Groq API.

## Setup

### 1. API Key

Grok menggunakan **Groq API Key** yang sama dengan provider Groq (Llama 3).

Tambahkan ke `.env`:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Model

Model yang digunakan: `moonshotai/kimi-k2-instruct-0905`

Model ini tersedia melalui Groq API, jadi tidak perlu API key terpisah.

### 3. Configuration

Default configuration:
- **Temperature**: 0.6
- **Max Tokens (Builder)**: 4096
- **Max Tokens (Tutor)**: 4096
- **Top P**: 1

Bisa diubah via environment variables:
```bash
GROK_MAX_TOKENS_BUILDER=4096
GROK_MAX_TOKENS_TUTOR=4096
```

## Features

- ✅ Text generation
- ✅ Code generation
- ✅ Support untuk Builder dan Tutor mode
- ✅ Menggunakan Groq SDK (sama dengan Llama 3)
- ✅ Model: Kimi K2 Instruct

## Usage

1. Pilih **"Kimi K2 (Grok)"** dari provider selector
2. Gunakan seperti provider lainnya
3. Sistem akan menggunakan Groq API dengan model Kimi K2

## Technical Details

- **SDK**: Groq SDK (sama dengan provider Groq)
- **API Key**: Menggunakan `GROQ_API_KEY`
- **Model**: `moonshotai/kimi-k2-instruct-0905`
- **Base URL**: Groq API (https://api.groq.com)

## Differences from Groq (Llama 3)

| Feature | Groq (Llama 3) | Grok (Kimi K2) |
|---------|----------------|----------------|
| Model | `llama-3.3-70b-versatile` | `moonshotai/kimi-k2-instruct-0905` |
| Temperature | 0.5 | 0.6 |
| Max Tokens | 8192 (builder) / 4096 (tutor) | 4096 (both) |
| Top P | Default | 1 |

## Troubleshooting

### Error: "Groq client not initialized"
- Pastikan `GROQ_API_KEY` sudah di-set di `.env`
- Restart server setelah menambahkan env var

### Model not found
- Pastikan model `moonshotai/kimi-k2-instruct-0905` tersedia di Groq
- Cek apakah API key memiliki akses ke model ini

### Rate Limit
- Grok menggunakan quota Groq API yang sama
- Cek quota di Groq dashboard
