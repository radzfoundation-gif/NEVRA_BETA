# 🔒 Grok Token Lock Feature

## Overview

Fitur ini mengunci akses ke model Kimi K2 (Grok) ketika token limit tercapai, dan membuka kembali secara otomatis setelah token di-recharge.

## Cara Kerja

### 1. Token Limit Check
- Sistem mengecek status Grok token limit secara real-time
- Limit: **200 tokens per hari** untuk free tier
- Check dilakukan setiap 30 detik secara otomatis

### 2. Lock Mechanism
- Jika token limit tercapai (`tokensUsed >= 200`):
  - Grok (Kimi K2) akan **terkunci** dan tidak bisa dipilih
  - Provider selector akan menampilkan status "Locked"
  - User tidak bisa memilih Grok sampai token di-recharge

### 3. Auto-Unlock
- Setelah token di-recharge (reset harian atau top-up):
  - Sistem akan otomatis detect perubahan
  - Grok akan **terbuka kembali** dan bisa dipilih
  - Status akan update secara real-time

## UI Indicators

### Provider Selector
- **Locked State:**
  - Icon 🔒 muncul di samping "Kimi K2"
  - Status: "Locked (200/200)"
  - Tooltip: "Kimi K2 token limit reached. Recharge tokens to unlock."
  - Button disabled (opacity 50%)

- **Available State:**
  - Normal appearance
  - Jika sisa token < limit: menampilkan "X tokens remaining"

### Mode Selection
- Grok button akan disabled jika locked
- Alert message jika user mencoba select Grok yang locked

### Chat Interface
- Warning banner muncul jika user mencoba menggunakan Grok yang locked
- Auto-switch ke Llama 3 jika Grok locked

## Implementation Details

### Files Created/Updated

1. **`hooks/useGrokTokenLimit.ts`** (NEW)
   - Hook untuk check Grok token limit status
   - Auto-refresh setiap 30 detik
   - Returns: `isGrokLocked`, `grokTokensUsed`, `grokTokensRemaining`

2. **`components/ui/ProviderSelector.tsx`** (UPDATED)
   - Disable Grok jika `isGrokLocked === true`
   - Show locked status dengan icon dan tooltip
   - Display token remaining count

3. **`components/pages/ChatInterface.tsx`** (UPDATED)
   - Check Grok lock status sebelum send message
   - Auto-switch ke Llama 3 jika Grok locked
   - Show warning banner
   - Refresh limit setelah token usage

4. **`components/pages/Home.tsx`** (UPDATED)
   - Prevent selecting Grok if locked
   - Show alert message

### Logic Flow

```
User Action → Check isGrokLocked
  ├─ Locked? 
  │   ├─ Yes → Block selection / Auto-switch to Llama 3
  │   └─ Show alert: "Token limit reached. Recharge to unlock."
  └─ Not Locked?
      └─ Allow Grok usage
      
After Token Usage → Refresh Limit Status
  └─ If limit reached → Lock Grok
  └─ If limit reset → Unlock Grok (auto)
```

## User Experience

### Scenario 1: Token Limit Reached
1. User menggunakan Grok sampai 200 tokens
2. Sistem detect limit tercapai
3. Grok button menjadi disabled dengan icon 🔒
4. User mencoba select Grok → Alert: "Token limit reached"
5. Sistem auto-switch ke Llama 3

### Scenario 2: Token Recharged
1. User recharge token (atau reset harian)
2. Sistem auto-refresh setiap 30 detik
3. Grok status berubah dari locked → unlocked
4. Grok button menjadi enabled kembali
5. User bisa select Grok lagi

## Configuration

### Environment Variables
Tidak ada env vars baru yang diperlukan. Menggunakan existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLERK_SUPABASE_TEMPLATE`

### Database
Menggunakan existing table:
- `ai_usage` - untuk tracking token usage per provider
- Filter: `provider = 'grok'` untuk Grok-specific tracking

## Testing

### Manual Test Cases

1. **Lock Test:**
   - Use Grok sampai 200 tokens
   - Verify Grok button becomes disabled
   - Try to select Grok → Should show alert
   - Verify auto-switch to Llama 3

2. **Unlock Test:**
   - Wait for daily reset (or manually reset in DB)
   - Verify Grok button becomes enabled
   - Verify can select Grok again

3. **Real-time Update:**
   - Use Grok in one tab
   - Open another tab
   - Verify status syncs within 30 seconds

## Troubleshooting

### Grok tidak terkunci meski limit tercapai
- Check: Apakah `useGrokTokenLimit` hook terpasang?
- Check: Apakah `checkGrokTokenLimit` function bekerja?
- Check: Database query untuk `ai_usage` dengan `provider = 'grok'`

### Grok tidak terbuka setelah recharge
- Check: Apakah auto-refresh berjalan (30 detik interval)
- Check: Apakah token benar-benar di-reset di database
- Manual refresh: Call `refreshGrokLimit()` function

### Status tidak update real-time
- Check: Apakah useEffect di `useGrokTokenLimit` berjalan
- Check: Apakah interval tidak di-clear
- Check: Console untuk error messages

## Future Enhancements

1. **Manual Refresh Button** - User bisa manually refresh status
2. **Token Recharge UI** - Direct link untuk recharge tokens
3. **Notification System** - Toast notification saat Grok locked/unlocked
4. **Usage History** - Show detailed token usage history
5. **Predictive Lock** - Warn user sebelum limit tercapai
