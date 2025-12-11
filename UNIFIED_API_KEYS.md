# 🔑 Unified API Keys Management

## Overview

Sistem unified API keys memungkinkan user untuk mengatur semua API keys mereka dalam satu interface. Sistem akan otomatis menggunakan API key yang sesuai berdasarkan jenis task (image, text, code, voice).

## Fitur Utama

### ✅ Yang Sudah Diimplementasi

1. **Unified API Key Management**
   - Satu interface untuk mengatur semua API keys
   - Support multiple providers: Groq, DeepSeek, OpenAI, OpenAI Image, Kimi
   - Secure storage di Supabase database

2. **Auto-Routing Berdasarkan Task Type**
   - **Image**: Otomatis menggunakan API key yang dikonfigurasi untuk task "Image"
   - **Text**: Otomatis menggunakan API key untuk task "Text"
   - **Code**: Otomatis menggunakan API key untuk task "Code"
   - **Voice**: Otomatis menggunakan API key untuk task "Voice"

3. **Priority System**
   - Setiap API key bisa memiliki priority
   - API key dengan priority lebih tinggi akan digunakan terlebih dahulu

4. **Fallback Mechanism**
   - Jika user tidak punya API key untuk task tertentu, sistem akan menggunakan server's default API key
   - Seamless transition tanpa error

## Cara Menggunakan

### 1. Setup Database

Jalankan SQL migration untuk membuat tabel `user_api_keys`:

```bash
# Di Supabase SQL Editor, jalankan:
supabase-user-api-keys.sql
```

### 2. Buka API Keys Manager

1. Klik tombol **Settings** (⚙️) di header ChatInterface
2. Modal API Keys Manager akan muncul

### 3. Tambah API Key

1. Klik **"Add New API Key"**
2. Pilih **Provider** (Groq, DeepSeek, OpenAI, dll)
3. Masukkan **API Key** Anda
4. Pilih **Auto-Route For** (task types yang akan menggunakan API key ini):
   - ☑️ Image - Untuk task yang melibatkan gambar
   - ☑️ Text - Untuk task text generation
   - ☑️ Code - Untuk code generation
   - ☑️ Voice - Untuk voice call
5. Set **Priority** (0-100, lebih tinggi = digunakan lebih dulu)
6. Klik **Save API Key**

### 4. Contoh Konfigurasi

**Scenario: User ingin menggunakan Kimi API untuk gambar**

1. Add API Key:
   - Provider: `kimi` (atau `openai_image`)
   - API Key: `sk-...`
   - Auto-Route For: ☑️ **Image** saja
   - Priority: `10`

2. Ketika user upload gambar dan generate:
   - Sistem otomatis detect task type = "image"
   - Sistem cari API key dengan auto-route "image"
   - Gunakan Kimi API key untuk request

**Scenario: User ingin menggunakan Groq untuk text, OpenAI untuk code**

1. Add Groq API Key:
   - Auto-Route For: ☑️ **Text**
   - Priority: `5`

2. Add OpenAI API Key:
   - Auto-Route For: ☑️ **Code**
   - Priority: `5`

3. Sistem akan otomatis switch API key berdasarkan task type

## Technical Details

### Database Schema

```sql
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'groq', 'deepseek', 'openai', 'openai_image', 'kimi'
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    auto_route_for TEXT[], -- ['image', 'text', 'code', 'voice']
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Auto-Routing Logic

```typescript
// Di ChatInterface.tsx, sebelum generateCode:
const taskType = imagesToSend.length > 0 ? 'image' : mode === 'builder' ? 'code' : 'text';
const apiKeyData = await getApiKeyForTask(user.id, taskType, provider, token);

if (apiKeyData) {
  userApiKey = apiKeyData.apiKey;
  effectiveProvider = apiKeyData.provider;
}
```

### Server Integration

Server akan menggunakan user's API key jika disediakan:

```javascript
// server/index.js
const apiKey = userApiKey || PROVIDER_KEYS[provider];

// Create client with user's API key
const clientToUse = userApiKey 
  ? new OpenAI({ apiKey: userApiKey, ... })
  : openaiClient;
```

## Security Notes

⚠️ **Important**: 
- API keys disimpan di database (encrypted di production)
- Hanya user yang punya akses ke API keys mereka sendiri (RLS enabled)
- API keys tidak pernah dikirim ke client kecuali saat digunakan untuk request

## File Structure

- `supabase-user-api-keys.sql` - Database migration
- `components/ApiKeysManager.tsx` - UI untuk manage API keys
- `lib/database.ts` - Functions untuk CRUD API keys
- `server/index.js` - Server logic untuk menggunakan user API keys
- `lib/ai.ts` - generateCode function dengan user API key support

## Future Enhancements

- [ ] Client-side encryption untuk API keys
- [ ] API key rotation/expiration
- [ ] Usage tracking per API key
- [ ] Cost estimation per API key
- [ ] Multiple API keys per provider (load balancing)
- [ ] API key testing/validation before saving

## Troubleshooting

### API key tidak digunakan
- Pastikan API key sudah di-set dengan auto-route untuk task type yang sesuai
- Cek priority - API key dengan priority lebih tinggi akan digunakan lebih dulu
- Pastikan `is_active = true`

### Error "API key not configured"
- Pastikan API key sudah di-save dengan benar
- Cek console untuk error details
- Pastikan user sudah login

### Auto-routing tidak bekerja
- Pastikan task type sudah di-set di auto_route_for
- Cek apakah ada API key lain dengan priority lebih tinggi
- Pastikan API key `is_active = true`
