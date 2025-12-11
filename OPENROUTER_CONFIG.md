# OpenRouter Configuration

## Max Tokens Configuration

Max tokens untuk setiap provider dapat dikonfigurasi via environment variables:

### Environment Variables

```bash
# OpenRouter (GPT-4o via OpenRouter)
OPENROUTER_MAX_TOKENS=2000  # Default: 2000 (safe untuk avoid credit errors)

# Groq
GROQ_MAX_TOKENS_BUILDER=8192  # Default: 8192
GROQ_MAX_TOKENS_TUTOR=4096    # Default: 4096

# DeepSeek
DEEPSEEK_MAX_TOKENS=4096  # Default: 4096
```

### Retry Mechanism

OpenRouter memiliki retry mechanism otomatis:
- Jika error credits terjadi, sistem akan otomatis retry dengan max_tokens yang lebih rendah
- Retry sequence: 100% → 75% → 50% → 25% dari base max_tokens
- Ini membantu menghindari error credits tanpa perlu manual adjustment

### User Quota Limit

Limit di `lib/tokenLimit.ts` tetap dipertahankan untuk:
- User quota management (FREE_TOKEN_LIMIT = 200)
- Subscription tracking
- Usage analytics

**Note**: Limit di `tokenLimit.ts` adalah untuk user quota, bukan API limit. API limit (max_tokens) dikonfigurasi di server.

### Tips

1. **Jika sering dapat error credits di OpenRouter:**
   - Kurangi `OPENROUTER_MAX_TOKENS` di `.env`
   - Atau tambahkan lebih banyak credits di OpenRouter

2. **Jika ingin output lebih panjang:**
   - Tingkatkan `OPENROUTER_MAX_TOKENS` (pastikan credits cukup)
   - Atau gunakan Groq yang memiliki limit lebih tinggi

3. **Untuk production:**
   - Set `OPENROUTER_MAX_TOKENS` sesuai dengan budget credits
   - Monitor usage di OpenRouter dashboard
