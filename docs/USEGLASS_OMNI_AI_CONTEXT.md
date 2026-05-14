# UseGlass Omni AI Context

This file is a handover document for future AI agents. Read it before editing UseGlass AI Omni.

## Product Direction

UseGlass AI Omni is a prompt-first AI workspace. The user should not need to manually choose workflow mode, style, skill, or connector before sending a prompt.

Core flow:

```text
User prompt -> Glass Auto Router -> selected tool/mode/style/skill/connector/canvas -> response -> canvas/save/export actions
```

Do not rebuild from scratch. Do not make a dashboard. Do not replace the main Home or Chat components.

## Main Components

### `components/ResearchWelcome.tsx`

Role:

- Home/welcome workspace.
- Large prompt input.
- Auto Pilot UX.
- Suggestions.
- Upload/file selection entry.
- Routes prompt to chat with router state.

Rules:

- Keep this as Home.
- Do not fill default prompt input with many chips.
- Manual controls should stay secondary/advanced.

### `components/pages/ChatInterface.tsx`

Role:

- Main chat workspace.
- Receives Home route state.
- Runs `routeGlassIntent` if prompt starts directly inside chat.
- Manages messages, routing chips, canvas, PDF, builder/code flow.

Important current fixes:

- Route-state auto-send watches `location.key` so prompt from Home processes without refresh.
- `/chat/new` welcome submit creates optimistic user bubble immediately before heavy processing.
- Build/code flow sets Canvas active first, waits two animation frames, then writes chat summary.
- Web Canvas avoids rendering React/TSX as plain broken HTML.
- PDF download is manual through canvas button, not automatic.

### `components/chat/ChatInput.tsx`

Role:

- Main bottom prompt input.
- Grok-like clean pill layout.
- Upload preview cards/chips.
- Send icon appears when text exists; voice icon shows when empty.
- Usage warning is minimal inside input controls.

Rules:

- Do not re-add default chips into input.
- Keep Auto Pilot in drawer/advanced, not always visible.
- Long text must wrap inside input cleanly.

### `components/Sidebar.tsx`

Role:

- Main navigation.
- Simplified Tools/Resources structure.

Expected groups:

- Main Menu: Home, New Chat, Projects, Documents, Gallery, Pricing, Settings
- Tools: Glass Chat, Glass Search, Glass Build, Glass Code, Glass Omni
- Resources: Skills Library, Connectors, Styles

Do not re-add Workflow Modes as large sidebar section.

## Glass Auto Router

File: `lib/glassAutoRouter.ts`

Exports:

- `GlassRoutingResult`
- `routeGlassIntent(prompt, options)`

Router output fields:

- `detectedIntent`
- `selectedTool`
- `selectedWorkflowMode`
- `selectedStyle`
- `selectedSkill`
- `selectedConnector`
- `canvasType`
- `outputFormat`
- `confidence`
- `reason`

Router is local/rule-based. It should stay fast and realtime.

## Current Routing Rules

### Documents / PDF

Keywords include:

- `buatkan pdf`, `buat pdf`, `generate pdf`, `proposal`, `makalah`, `laporan`, `PRD`, `artikel panjang`, `essay`, `surat`

Expected:

- Tool: `omni` or `chat`
- Workflow: `create` or `think`
- Style: `professional`
- Skill: `Business Analyst`, `Academic Writer`, or `PRD Writer`
- Canvas: `document`
- Output format: `pdf` or `document`

### Strategy / Launch

Keywords include:

- `strategy`, `strategi`, `roadmap`, `launch`, `launching`, `GTM`, `monetization`, `pricing`, `growth`, `startup`, `SaaS plan`

Expected:

- Tool: `omni`
- Workflow: `launch` or `think`
- Style: `startup-founder` or `professional`
- Skill: `SaaS Planner` or `Business Analyst`
- Canvas: `document` when long

### Research

Keywords include:

- `riset`, `research`, `cari data`, `bandingkan`, `kompetitor`, `compare`, `trend`, `market research`, `sumber`

Expected:

- Tool: `search`
- Workflow: `research`
- Style: `research-analyst`
- Skill: `Business Analyst` or `Academic Writer`
- Connector: `Web Search` only if available/connected
- Canvas: `document` when long

### Code / Debug

Keywords include:

- `error`, `debug`, `fix`, `npm run`, `build failed`, `kode`, `code`, `refactor`, `terminal`, `stack trace`, `bug`

Expected:

- Tool: `code`
- Workflow: `code`
- Style: `senior-engineer`
- Skill: `Code Debugger`
- Canvas: `code` for longer code output

### UI / Web Build

Keywords include:

- `buat website`, `landing page`, `dashboard`, `UI`, `component`, `komponen`, `app layout`, `halaman web`, `pricing page`, `login page`, `design`, `glassmorphism`

Expected:

- Tool: `builder`
- Workflow: `build`
- Style: `startup-founder` or `creative-writer`
- Skill: `UI Reviewer` or `Brand Copywriter`
- Canvas: `web`

## Canvas Behavior

Canvas state fields live in `ChatInterface.tsx` as `glassCanvas`.

Types:

- `web`
- `document`
- `code`
- `presentation`
- `general`

States:

- `closed`
- `opening`
- `active`
- `fullscreen`
- `collapsed`
- `error`

Important behavior:

- Web/code prompts open canvas first with `Dreaming interface...`.
- When generated content is ready, `glassCanvas.state` becomes `active`.
- Chat summary should appear after canvas active, not before.
- TSX/React code must not be rendered directly inside iframe as HTML.
- If generated output is not standalone HTML, use clean fallback HTML preview.
- Document/PDF canvas should preview content and wait for user click to download.

## Database Work

Files:

- `server/turso.js`
- `server/tursoRoutes.js`
- `supabase/migrations/005_useglass_workspace.sql`
- `supabase/migrations/006_useglass_omni_database.sql`
- `docs/TURSO_MIGRATION.md`

Purpose:

- Workspace/projects/documents/canvas/save/export/resource data structures.
- Built-in catalog seed for skills/connectors/resources where applicable.

Future agent should inspect migrations before changing DB names.

## UX Requirements To Preserve

- UseGlass branding, not Noir in user-facing UI.
- Clean white glassmorphism.
- Prompt-first behavior.
- No dashboard replacement.
- No crowded default chips.
- Auto Pilot is optional/advanced.
- Tools are simple; Resources contain Skills/Connectors/Styles.
- Connector placeholders must be honest: `coming soon`, `disconnected`, or `connect first`.
- Usage limit warning stays minimal in input.

## Known Follow-Up Opportunities

1. True live React preview for TSX components. Current fallback prevents broken preview but does not compile React inside iframe.
2. Better extraction of standalone HTML from AI responses.
3. More robust PDF styling and page-break handling.
4. Persistent user preferences for disabled skills/styles/connectors.
5. Automated UI tests for Home -> Chat -> Canvas routing.

## Validation Commands

```bash
npm run build
npm run api
npm run dev
npm run dev:all
```

Expected build status:

- Build passes.
- Large chunk warnings may remain.

## Do Not Do

- Do not replace `ResearchWelcome.tsx` with a dashboard.
- Do not replace `ChatInterface.tsx` with a new chat system.
- Do not show all Workflow Modes/Styles/Skills as required user choices.
- Do not auto-download PDFs on generation.
- Do not pretend connectors are connected when not actually connected.
- Do not render TSX source directly as Web Canvas preview.
