# 🎯 Grok (Kimi K2) as Default Provider

## Overview

Grok (Kimi K2) sekarang menjadi default provider dengan token limit 200. Jika limit habis, sistem akan otomatis fallback ke Llama 3 (groq).

## Configuration

### Default Provider
- **Default**: Grok (Kimi K2) - `moonshotai/kimi-k2-instruct-0905`
- **Fallback**: Llama 3 (Groq) - `llama-3.3-70b-versatile`

### Token Limits

**Grok (Kimi K2):**
- Limit: **200 tokens** per day (free tier)
- Tracking: Separate tracking untuk provider `grok`
- Location: `lib/grokTokenLimit.ts`

**General (All Providers):**
- Limit: **200 tokens** per day (free tier)
- Tracking: Combined tracking untuk semua provider
- Location: `lib/tokenLimit.ts`

## Fallback Logic

1. **User memilih atau default ke Grok (Kimi K2)**
2. **Sistem check Grok token limit** sebelum setiap request
3. **Jika limit habis:**
   - Auto-switch ke Llama 3 (groq)
   - Update UI provider selector
   - Show notification: "Kimi K2 token limit reached, switched to Llama 3"
   - Continue dengan Llama 3

4. **Jika limit belum habis:**
   - Gunakan Grok (Kimi K2) seperti biasa
   - Track usage ke database dengan provider `grok`

## Token Tracking

### Grok Token Tracking
- Tracked separately in `ai_usage` table with `provider = 'grok'`
- Reset daily (WIB timezone)
- Checked before each request

### Example Flow

```
User Request → Check Grok Limit
  ├─ Limit OK (< 200) → Use Grok (Kimi K2)
  └─ Limit Exceeded (>= 200) → Fallback to Llama 3 (groq)
```

## Default Provider Settings

### Mode Selection
- Default: `grok` (Kimi K2)

### Chat Interface
- Default: `grok` (Kimi K2)
- Fallback: `groq` (Llama 3) jika Grok limit habis

### Provider Selector
- Order: Llama 3 → Kimi K2 → GPT-4o (Premium)

## User Experience

1. **First 200 tokens**: User menggunakan Kimi K2
2. **After 200 tokens**: 
   - Sistem otomatis switch ke Llama 3
   - User melihat notification
   - Provider selector update ke Llama 3
   - Semua request berikutnya menggunakan Llama 3

## Technical Details

### Files Modified
- `components/pages/ChatInterface.tsx` - Default provider & fallback logic
- `lib/grokTokenLimit.ts` - Grok-specific token limit checking
- `components/ui/ProviderSelector.tsx` - Provider order

### Database
- `ai_usage` table tracks usage per provider
- Filter by `provider = 'grok'` untuk check Grok limit
- Daily reset (WIB timezone)

## Testing

1. **Test default provider:**
   - Start new chat → Should default to Kimi K2

2. **Test fallback:**
   - Use Grok until 200 tokens
   - Next request → Should auto-switch to Llama 3
   - Check notification message

3. **Test token tracking:**
   - Check `ai_usage` table
   - Verify `provider = 'grok'` entries
   - Verify daily reset
