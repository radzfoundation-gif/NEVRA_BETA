# MCP Testing Guide

## Quick Test

MCP Server sudah **ENABLED** di `lib/workflow/config.ts`!

### Cara Test MCP:

#### 1. **Pastikan MCP Server Running**
```bash
npm run mcp:dev
```
Anda akan lihat:
```
Firebase Admin initialized for MCP server
Noir AI MCP Server running on stdio
```

#### 2. **Test Otomatis via Chat**
Karena MCP sudah enabled, setiap kali Noir AI memproses chat, ia akan:
- ✅ Coba save memory via MCP
- ✅ Coba retrieve memory via MCP  
- ⚠️ Fallback ke direct Firebase jika MCP gagal

#### 3. **Monitor Logs**
Buka terminal dengan `npm run api` dan perhatikan log:
- `💾 MemoryEngine: Workflow result saved via MCP` = MCP working ✅
- `MCP save failed, falling back...` = MCP error, using fallback ⚠️

#### 4. **Test Manual** (Optional)
```bash
# Di terminal baru (pastikan mcp:dev running)
npm run test:mcp
```

## Verification Steps

### A. Real-time Test via Chat Interface
1. Login ke Noir AI
2. Kirim chat: "Hello, test MCP"
3. Check terminal `npm run api`, harusnya ada log MCP
4. Logout dan login lagi
5. Memory harusnya persist (via MCP atau Firebase)

### B. Check Firebase
Buka Firebase Console → Firestore:
- Collection: `users/{userId}/memories`
- Harusnya ada entry baru setiap chat

## Troubleshooting

**Problem:** MCP connection failed
- **Solution:** Pastikan `npm run mcp:dev` running di terminal terpisah

**Problem:** No MCP logs in api terminal
- **Check:** `lib/workflow/config.ts` → `enableMCP: true`
- **Check:** `logStages: true` untuk melihat logs

**Problem:** Memory tidak persist
- **Fallback:** MCP otomatis fallback ke Firebase direct
- **Check:** Firebase credentials OK

## Architecture Flow

```
User Chat
    ↓
Workflow Orchestrator
    ↓
MemoryEngine.saveWorkflowResult()
    ├─→ Try MCP Client
    │      ↓
    │   MCP Server (stdio)
    │      ↓
    │   Firebase Admin
    │
    └─→ Fallback: Direct Firebase
```

## Success Indicators

✅ **MCP Working:**
- Terminal `mcp:dev`: No errors
- Terminal `api`: Logs show "saved via MCP"
- Chat history persists across sessions

✅ **Fallback Working:**
- No MCP server = still works via direct Firebase
- Logs show "falling back to direct save"

## Next Steps

1. Chat dengan Noir AI untuk generate memories
2. Check logs untuk confirm MCP usage
3. Test persistence dengan logout/login
4. Monitor performance vs direct Firebase
