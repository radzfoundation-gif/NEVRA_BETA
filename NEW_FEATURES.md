# 🚀 Fitur Baru NEVRA

Dokumentasi untuk fitur-fitur baru yang telah diimplementasikan.

## 📚 Fitur untuk NEVRA Tutor

### 1. Web Search (seperti Perplexity.ai) ✅

**Deskripsi:**
Fitur web search memungkinkan NEVRA Tutor untuk mencari informasi real-time dari internet dan memberikan jawaban dengan citations.

**Cara Menggunakan:**
1. Masuk ke Tutor Mode
2. Klik tombol **Search** (ikon search) di area input
3. Ketik pertanyaan Anda
4. NEVRA akan otomatis mencari informasi dari web dan memberikan jawaban dengan sumber

**Konfigurasi:**
- Tambahkan `TAVILY_API_KEY` ke `.env` untuk menggunakan Tavily API (recommended)
- Atau backend akan menggunakan fallback search

TAVILY_API_KEY=your_tavily_api_key_here

**File yang Ditambahkan:**
- `lib/webSearch.ts` - Web search logic
- `components/SearchResults.tsx` - UI untuk menampilkan hasil search
- Endpoint: `POST /api/search` di `server/index.js`

---

### 2. Document Upload & Analysis ✅

**Deskripsi:**
Upload dan analisis dokumen (PDF, DOCX, TXT, MD) untuk digunakan sebagai konteks dalam percakapan.

**Cara Menggunakan:**
1. Masuk ke Tutor Mode
2. Klik tombol **FileText** (ikon dokumen) di area input
3. Pilih file yang ingin diupload
4. Dokumen akan di-parse dan tersedia sebagai konteks
5. Tanyakan apapun tentang dokumen tersebut

**Format yang Didukung:**
- PDF (`.pdf`)
- Word Documents (`.docx`)
- Text Files (`.txt`)
- Markdown (`.md`)

**File yang Ditambahkan:**
- `lib/documentParser.ts` - Document parsing logic
- `components/DocumentViewer.tsx` - UI untuk melihat dokumen
- Endpoint: `POST /api/parse-document` di `server/index.js`

**Catatan:**
- Untuk parsing PDF/DOCX, install dependencies:
  ```bash
  npm install multer pdf-parse mammoth
  ```

---

### 3. Code Execution Sandbox ✅

**Deskripsi:**
Jalankan kode JavaScript/Python langsung di browser untuk pembelajaran interaktif.

**Cara Menggunakan:**
1. Masuk ke Tutor Mode
2. Klik tombol **Terminal** (ikon terminal) di area input
3. Tulis kode JavaScript atau Python
4. Klik "Run" untuk mengeksekusi
5. Lihat output atau error di panel bawah

**Bahasa yang Didukung:**
- JavaScript (client-side)
- TypeScript (dieksekusi sebagai JavaScript)
- Python (membutuhkan backend setup)

**File yang Ditambahkan:**
- `lib/codeExecutor.ts` - Code execution logic
- `components/CodeSandbox.tsx` - UI untuk code sandbox
- Endpoint: `POST /api/execute-code` di `server/index.js`

**Keamanan:**
- Code execution dilakukan dengan validasi keamanan
- Potentially dangerous patterns akan di-detect
- Python execution membutuhkan backend yang aman

---

## 🔧 Konfigurasi Backend

### Environment Variables

Tambahkan ke `.env`:

```env
# Web Search (Tavily API - Recommended)
TAVILY_API_KEY=your_tavily_api_key

# Atau gunakan alternatif:
# SERPAPI_KEY=your_serpapi_key
# GOOGLE_CSE_API_KEY=your_google_cse_key
# GOOGLE_CSE_ID=your_google_cse_id
```

### Install Dependencies (Optional)

Untuk document parsing lengkap:
```bash
npm install multer pdf-parse mammoth
```

Untuk Python execution:
```bash
# Setup Python runtime atau Pyodide
```

---

## 📝 Cara Menggunakan Fitur Baru

### Web Search
```
1. Buka NEVRA Tutor
2. Klik tombol Search (ikon 🔍)
3. Ketik: "Apa itu React Hooks?"
4. NEVRA akan mencari dari web dan memberikan jawaban dengan citations
```

### Document Analysis
```
1. Buka NEVRA Tutor
2. Klik tombol Document (ikon 📄)
3. Upload file PDF/DOCX/TXT
4. Tanyakan: "Apa poin utama dari dokumen ini?"
5. NEVRA akan menggunakan dokumen sebagai konteks
```

### Code Sandbox
```
1. Buka NEVRA Tutor
2. Klik tombol Terminal (ikon 💻)
3. Tulis kode:
   console.log("Hello, World!");
4. Klik "Run"
5. Lihat output di panel bawah
```

---

## 🎯 Next Steps

Fitur yang masih perlu diimplementasikan:

1. **Enhanced Visual Editor** - Drag & drop components
2. **Agentic Planning** - AI membuat rencana sebelum generate code
3. **Database Integration** - Connect ke Supabase/PostgreSQL
4. **API Integration Wizard** - Connect ke external APIs
5. **Mobile App Generation** - Generate React Native/Flutter

---

## 🐛 Troubleshooting

### Web Search tidak bekerja
- Pastikan `TAVILY_API_KEY` sudah di-set di `.env`
- Check console untuk error messages
- Backend akan menggunakan fallback jika API key tidak ada

### Document parsing error
- Pastikan file format didukung (PDF, DOCX, TXT, MD)
- Install dependencies: `npm install multer pdf-parse mammoth`
- Check file size (max recommended: 10MB)

### Code execution error
- JavaScript execution bekerja di browser
- Python execution membutuhkan backend setup
- Check console untuk error details

---

## 📚 Referensi

- [Tavily API Docs](https://tavily.com/docs)
- [Perplexity.ai](https://www.perplexity.ai) - Inspiration untuk web search
- [Claude.ai](https://claude.ai) - Inspiration untuk tutor features
