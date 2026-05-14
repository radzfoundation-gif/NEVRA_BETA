# UseGlass AI Omni

UseGlass AI Omni adalah prompt-first AI workspace untuk chat, research, coding, UI/app building, documents, canvas, skills, connectors, projects, dan export workflow.

Flow utama produk:

```text
Idea -> Prompt -> Auto Router -> Chat / Research / Build / Code -> Canvas -> Save to Project -> Export
```

Project ini bukan dashboard analytics. Home tetap memakai `components/ResearchWelcome.tsx` sebagai welcome workspace utama, dan chat utama tetap memakai `components/pages/ChatInterface.tsx`.

## What's New

### Prompt-First Auto Routing

UseGlass sekarang memakai `Glass Auto Router` lokal berbasis rule matching:

- File utama: `lib/glassAutoRouter.ts`
- Function: `routeGlassIntent(prompt, options)`
- Output internal: intent, tool, workflow mode, style, skill, connector, canvas type, output format, confidence, dan reason

User tidak wajib memilih Workflow Modes, Styles, Skills, atau Connectors sebelum mengetik prompt. Sistem otomatis memilih setting terbaik dari isi prompt.

### Simplified Sidebar

Sidebar disederhanakan:

- Main Menu: Home, New Chat, Projects, Documents, Gallery, Pricing, Settings
- Tools: Glass Chat, Glass Search, Glass Build, Glass Code, Glass Omni
- Resources: Skills Library, Connectors, Styles

Workflow Modes, Skills, Styles, dan Connectors tidak lagi memenuhi menu Tools utama.

### Glass Canvas

Canvas dipakai untuk output besar atau visual:

- `document` untuk PDF, proposal, PRD, laporan, artikel panjang
- `web` untuk website, landing page, login page, dashboard, UI, component
- `code` untuk kode panjang, debug, refactor, file structure
- `presentation` untuk pitch deck atau slide outline
- `general` untuk canvas bebas

Canvas behavior penting:

- Web/code intent membuka canvas otomatis.
- Loading canvas memakai state `Dreaming interface...`.
- Untuk build/code, canvas diaktifkan dulu sebelum chat summary muncul.
- Jika model mengembalikan TSX/React mentah, Web Canvas tidak merender TSX sebagai HTML rusak; fallback preview HTML bersih dipakai.
- Document Canvas punya tombol download PDF, tidak auto-download.

### Chat Input UX

Chat input dibuat lebih clean dan prompt-first:

- Default tidak menampilkan chip manual penuh.
- `Auto Pilot` dipindah ke drawer/advanced control.
- Usage warning jadi icon/pill kecil, bukan banner besar.
- Voice button berubah menjadi send button saat user mengetik prompt.
- Upload file/gambar tampil sebagai preview rapi di input.
- Submit dari `/chat/new` langsung memproses prompt tanpa refresh.

### UseGlass Branding

UI user-facing diarahkan ke UseGlass AI:

- Logo UseGlass dipakai di layout utama.
- Copy lama Noir dikurangi/diganti di area utama.
- Visual direction: white clean glassmorphism, soft blur, rounded panels, subtle gradients.

### Database

Database workspace sudah diperluas untuk UseGlass Omni:

- Local/server schema: `server/turso.js`
- API routes tambahan: `server/tursoRoutes.js`
- Supabase migrations:
  - `supabase/migrations/005_useglass_workspace.sql`
  - `supabase/migrations/006_useglass_omni_database.sql`
- Detail migrasi: `docs/TURSO_MIGRATION.md`

## Key Files For AI Agents

Read these first when continuing work:

- `docs/USEGLASS_OMNI_AI_CONTEXT.md` - detailed handover and current product behavior
- `components/ResearchWelcome.tsx` - Home/welcome prompt workspace
- `components/pages/ChatInterface.tsx` - main chat, routing, canvas, PDF, builder flow
- `components/chat/ChatInput.tsx` - prompt input UX, upload, Auto Pilot, send/voice behavior
- `components/Sidebar.tsx` - simplified navigation structure
- `lib/glassAutoRouter.ts` - auto-routing rules
- `server/index.js` - backend API, PDF generation, AI endpoints
- `server/turso.js` - local DB schema
- `supabase/migrations/006_useglass_omni_database.sql` - full Omni DB migration

## Routing Examples

| Prompt | Tool | Workflow | Style | Skill | Canvas |
|---|---|---|---|---|---|
| `Tolong buatkan PDF proposal bisnis UseGlass AI` | Glass Omni | Create | Professional | Business Analyst | Document |
| `Buatkan strategy launching UseGlass AI` | Glass Omni | Launch | Startup Founder | SaaS Planner | Document if long |
| `Fix error npm run build ini` | Glass Code | Code | Senior Engineer | Code Debugger | Code if long |
| `Riset kompetitor AI workspace` | Glass Search | Research | Research Analyst | Business Analyst | Document if long |
| `Buat login page SMA glassmorphism` | Glass Build | Build | Creative Writer / Startup Founder | UI Reviewer | Web |

## Run Locally

Install dependencies:

```bash
npm install
```

Run API:

```bash
npm run api
```

Run frontend:

```bash
npm run dev
```

Run both API and frontend:

```bash
npm run dev:all
```

Build production bundle:

```bash
npm run build
```

## Environment

Copy `.env.local.example` to `.env.local` and fill required keys.

Important environment groups:

- Supabase auth/database keys
- AI provider keys / OpenAI-compatible keys
- Turso or local database config if used
- Payment keys if pricing/subscription features are tested

Do not commit real secrets.

## Current Validation

Latest validation before this README update:

```bash
npm run build
```

Build passed. Existing Vite warnings about large chunks may remain.

## Notes For Future Work

- Keep Home as `ResearchWelcome.tsx`; do not replace it with a dashboard.
- Keep Chat as `ChatInterface.tsx`; do not create a separate chat foundation.
- Improve true React live preview later if needed. Current Web Canvas fallback prevents broken TSX rendering.
- Connectors must not pretend to be connected if they are placeholder/coming soon.
- Preserve prompt-first UX: user types first, system routes automatically.
