# 🤖 Cursor Prompt — AI Tools SaaS (Generic / Stack-Agnostic)

Salin dan tempel prompt di bawah ini ke Cursor AI sesuai kebutuhan.

---

## 📁 FILE: `.cursorrules` (taruh di root project)

```
You are an expert full-stack engineer building a production-grade AI Tools SaaS application.

## PROJECT OVERVIEW
This is an AI-powered SaaS platform that allows users to work with documents and files using AI.
Core tools:
- AI Chat — conversational AI assistant
- DOCX Tool — generate and edit Word documents with AI
- PDF Tool — summarize, chat, and generate PDFs with AI
- XLSX Tool — analyze, generate, and clean spreadsheets with AI
- PPTX Tool — generate PowerPoint presentations with AI

## CODING RULES
1. Always use strict types — no implicit any
2. Validate all user inputs before processing
3. All API endpoints must check authentication before executing
4. Store all secrets in environment variables — never hardcode
5. Handle errors gracefully — always return meaningful error messages
6. File uploads: validate file type and size before processing (max 10MB)
7. Use streaming for AI responses where possible for better UX
8. Always add loading states and error states to every UI component
9. Write complete, working code — no placeholders or TODOs
10. Keep components small and focused (single responsibility)

## UI/DESIGN RULES
- Clean, modern, professional SaaS aesthetic
- Responsive design — mobile first
- Dark mode support
- Sidebar navigation for dashboard layout
- Toast notifications for success/error feedback
- Skeleton loaders for async content
- Consistent spacing, typography, and color usage throughout

## AI INTEGRATION RULES
- AI Model: claude-sonnet-4-20250514 (Anthropic Claude API)
- Always stream AI responses for better user experience
- System prompts must be specific to each tool's purpose
- Max tokens: 4096 per request
- API key must only be used server-side — never expose to client
- Endpoint: POST https://api.anthropic.com/v1/messages

## DATABASE SCHEMA
Core tables needed:
- users / profiles (id, name, email, avatar, credits, created_at)
- tool_history (id, user_id, tool_name, input_summary, output_url, created_at)
- files (id, user_id, filename, file_type, storage_path, size, created_at)

Users can only access their own data (row-level security / ownership checks).

## FILE PROCESSING LIBRARIES (choose based on your stack)
- DOCX: docx + mammoth
- PDF: pdf-lib + pdfjs-dist
- PPTX: pptxgenjs
- XLSX: exceljs

## PROJECT STRUCTURE
Organize code into:
- pages or routes — one per tool + auth pages
- components — reusable UI components, tool-specific components
- api / server — API handlers for each tool
- lib / utils — helper functions, AI client, DB client
- types — shared TypeScript types
- hooks — reusable logic (auth state, file upload, streaming, etc.)
- stores — global state management
```

---

## 💬 CURSOR CHAT PROMPTS

Gunakan prompt berikut satu per satu di Cursor Chat:

---

### 1. 🏗️ PROJECT SETUP

```
Setup a new AI Tools SaaS project using my existing stack.

Requirements:
1. Install all necessary dependencies for:
   - Authentication (user login/register/session)
   - Database ORM or client
   - AI integration (Anthropic SDK: @anthropic-ai/sdk)
   - File upload handling (react-dropzone)
   - Form validation (zod)
   - Toast notifications
   - Dark mode toggle
   - DOCX processing: docx, mammoth
   - PDF processing: pdf-lib, pdfjs-dist
   - PPTX generation: pptxgenjs
   - XLSX processing: exceljs

2. Create .env file template with placeholder keys:
   DATABASE_URL=
   AUTH_SECRET=
   ANTHROPIC_API_KEY=
   STORAGE_URL=

3. Setup the full folder structure as defined in .cursorrules
4. Configure the AI client (Anthropic) in lib/ai.ts
5. Setup middleware or guards to protect all /dashboard routes

Generate all base configuration and setup files.
```

---

### 2. 🔐 AUTH SYSTEM

```
Build a complete authentication system:

1. Login page:
   - Email + password form
   - OAuth button (Google)
   - "Forgot password" link
   - Redirect to /dashboard after successful login
   - Full form validation
   - Show errors inline

2. Register page:
   - Full name, email, password, confirm password fields
   - OAuth option
   - Auto-create user profile in database on register
   - Email verification support

3. Auth middleware to protect all /dashboard/* routes
4. Global auth state (user info, loading state, sign out function)
5. User avatar dropdown in top navbar with sign out option

Handle all edge cases: invalid credentials, expired sessions, unverified email.
```

---

### 3. 🧭 DASHBOARD LAYOUT

```
Build the main dashboard layout:

1. Sidebar navigation (collapsible on mobile):
   - Logo + brand name at top
   - Navigation links with icons:
     * Dashboard (overview)
     * AI Chat
     * Word / DOCX Tool
     * PDF Tool
     * Excel Tool
     * PowerPoint Tool
   - User profile section at the bottom (avatar, name, settings link)

2. Top navbar:
   - Current page title (dynamic)
   - Dark/light mode toggle
   - User credits display
   - Notification icon

3. Dashboard homepage:
   - Welcome message with user's name
   - Stats cards: Files Processed, Tools Used, Credits Remaining
   - Recent activity table (last 5 tool uses from database)
   - Quick action cards for each tool (icon, name, short description, CTA button)

4. Responsive: sidebar collapses to hamburger menu on mobile

Keep the design clean, modern, and professional.
```

---

### 4. 🤖 AI CHAT TOOL

```
Build a full-featured AI Chat interface:

1. Chat page UI:
   - Chat bubble layout (user messages on right, AI on left)
   - Streaming AI responses with typing indicator animation
   - Markdown rendering with syntax-highlighted code blocks
   - Copy button on code blocks
   - "New Chat" and "Clear Chat" buttons
   - Chat history list in a sidebar panel (saved to database)

2. API endpoint (POST /api/ai/chat):
   - Validate message input (Zod)
   - Check authentication
   - Call Anthropic claude-sonnet-4-20250514 with streaming
   - System prompt: helpful general-purpose AI assistant
   - Save conversation summary to tool_history table

3. File attachment support:
   - User can attach an image or PDF to their message
   - Convert to base64 and include in Claude API request

Make sure streaming works correctly and updates the UI in real time.
```

---

### 5. 📄 DOCX TOOL

```
Build the AI-powered Word Document tool:

1. Tool page UI with two modes:

   Generate mode:
   - Text area: describe the document you need
   - Tone selector: Professional / Casual / Academic / Legal
   - Language selector
   - "Generate Document" button
   - Preview panel showing the generated content
   - Download .docx button

   Edit mode:
   - Drag & drop upload for existing .docx files
   - Display extracted text from the uploaded file
   - Instruction text area: "What changes do you want?"
   - "Apply Changes" button
   - Download updated .docx file

2. API endpoint (POST /api/ai/docx):
   - Validate input
   - Check authentication
   - Call Claude to generate structured document content
   - Use `docx` library to build a proper .docx file:
     * Title, H1/H2/H3 headings, paragraphs, bullet lists
   - For edit mode: use `mammoth` to extract text from uploaded .docx
   - Return file for download
   - Save to tool_history in database
```

---

### 6. 📑 PDF TOOL

```
Build the AI-powered PDF tool:

1. Tool page with 3 tabs:

   Summarize tab:
   - Upload PDF (drag & drop, max 10MB)
   - Summary length options: Short / Medium / Detailed
   - Language selector
   - Display AI-generated summary with key bullet points
   - Copy to clipboard button

   Chat with PDF tab:
   - Upload PDF
   - Chat interface to ask questions about the document
   - AI answers based only on the PDF content

   Generate PDF tab:
   - Describe what PDF to generate
   - Template selector: Report / Letter / Invoice / Resume
   - Generate and download PDF

2. API endpoints:
   - POST /api/ai/pdf/summarize — extract text with pdfjs-dist, send to Claude
   - POST /api/ai/pdf/chat — extract text, pass as context for Q&A
   - POST /api/ai/pdf/generate — Claude generates content, pdf-lib builds PDF

3. For large PDFs: chunk the text (max 4000 tokens per chunk) before sending to Claude
```

---

### 7. 📊 XLSX TOOL

```
Build the AI-powered Excel/Spreadsheet tool:

1. Tool page with 3 tabs:

   Analyze tab:
   - Upload .xlsx or .csv file
   - Preview first 10 rows in a styled data table
   - Ask AI questions about the data (e.g., "What's the total revenue?")
   - AI responds with analysis and insights

   Generate tab:
   - Describe the spreadsheet needed (columns, rows, data type)
   - AI generates realistic data and creates .xlsx file
   - Download button

   Clean tab:
   - Upload messy data file
   - AI detects issues: duplicates, missing values, formatting errors
   - Display a summary of changes made
   - Download the cleaned file

2. API endpoints:
   - POST /api/ai/xlsx/analyze — parse with exceljs, send data to Claude
   - POST /api/ai/xlsx/generate — Claude returns JSON data, convert to .xlsx
   - POST /api/ai/xlsx/clean — Claude returns cleaned JSON, convert to .xlsx
```

---

### 8. 📽️ PPTX TOOL

```
Build the AI-powered PowerPoint generator:

1. Tool page UI:
   - Presentation title input
   - Topic / description textarea
   - Number of slides slider (5–20)
   - Style selector: Business / Creative / Minimal / Academic
   - Color theme picker (5–6 preset themes)
   - "Generate Presentation" button with progress bar
   - Slide preview (each slide rendered as a styled card)
   - Download .pptx button

2. API endpoint (POST /api/ai/pptx):
   - Validate input
   - Check authentication
   - Call Claude to generate slide content as structured JSON:
     {
       slides: [
         {
           title: string,
           content: string[],
           notes: string,
           type: "title" | "content" | "closing"
         }
       ]
     }
   - Use pptxgenjs to build the .pptx file:
     * Apply consistent fonts and colors per selected theme
     * Add slide numbers
   - Return file for download
   - Save to tool_history in database
```

---

### 9. 🗄️ DATABASE SCHEMA

```
Create the complete database schema for the app:

1. Tables:

profiles:
- id (primary key, uuid)
- user_id (foreign key → auth users, unique)
- full_name (text)
- avatar_url (text, nullable)
- credits (integer, default 100)
- created_at (timestamp)
- updated_at (timestamp)

tool_history:
- id (primary key, uuid)
- user_id (foreign key → users)
- tool_name (text) — values: 'chat', 'docx', 'pdf', 'xlsx', 'pptx'
- input_summary (text, nullable)
- output_url (text, nullable)
- credits_used (integer, default 1)
- created_at (timestamp)

files:
- id (primary key, uuid)
- user_id (foreign key → users)
- filename (text)
- file_type (text)
- storage_path (text)
- size_bytes (integer)
- created_at (timestamp)

2. Security: users can only read/write their own rows
3. Trigger: auto-create profile row when a new user registers
4. File storage bucket for user-uploaded files with access control
5. Generate TypeScript types from schema
```

---

### 10. 🌐 LANDING PAGE

```
Build a stunning SaaS landing page:

Design direction: dark, modern, professional AI tool aesthetic.
Dark background with subtle gradient accents and a vibrant primary accent color.
Clean, bold typography. No generic or template-looking design.

Sections:

1. NAVBAR
   - Logo, nav links: Features, Tools, Pricing, FAQ
   - Login button + "Get Started Free" CTA

2. HERO
   - Badge: "Powered by Claude AI"
   - Bold headline about saving time with AI-powered document tools
   - Subheadline explaining the value proposition
   - Two CTAs: "Start for Free" and "See Demo"
   - Animated mockup or illustration of the dashboard

3. TOOLS GRID
   - 6 cards, one per tool (Chat, DOCX, PDF, XLSX, PPTX, + one more)
   - Each card: icon, name, short description, hover animation

4. HOW IT WORKS
   - 3-step flow: Upload or describe → AI processes → Download result

5. FEATURES
   - Grid of 6 feature highlights with icons

6. TESTIMONIALS
   - 3 realistic user testimonials with avatar, name, role

7. CTA BANNER
   - "Start building smarter today" with sign-up button

8. FOOTER
   - Links, social icons, copyright

Add subtle scroll animations. Keep it fast and accessible.
```

---

## ⚡ TIPS PENGGUNAAN DI CURSOR

- Jalankan prompt **satu per satu** — jangan sekaligus
- Buka file yang relevan sebelum chat agar Cursor punya konteks
- Gunakan `@file` untuk reference file spesifik
- Mulai selalu dari **Project Setup** dulu
- Test setiap fitur sebelum lanjut ke prompt berikutnya
- Gunakan **Cursor Composer** (Ctrl+I) untuk edit banyak file sekaligus

---

*Generated for: AI Tools SaaS — Stack-Agnostic Version*
